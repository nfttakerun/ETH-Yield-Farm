const hre = require('hardhat');
const { assert, expect } = require('chai');
const web3 = require('web3');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}

// eslint-disable-next-line no-undef
describe('TokenFarm', () => {
  async function deployTokenFixture() {
    const [owner, investor] = await hre.ethers.getSigners();

    // コントラクトのdeploy
    const daitokenContractFactory = await hre.ethers.getContractFactory(
      'DaiToken',
    );
    const dapptokenContractFactory = await hre.ethers.getContractFactory(
      'DappToken',
    );
    const tokenfarmContractFactory = await hre.ethers.getContractFactory(
      'TokenFarm',
    );
    const daiToken = await daitokenContractFactory.deploy();
    const dappToken = await dapptokenContractFactory.deploy();
    const tokenFarm = await tokenfarmContractFactory.deploy(
      dappToken.address,
      daiToken.address,
    );

    // 全てのDappトークンをファームに移動する(1 million)
    await dappToken.transfer(tokenFarm.address, tokens('1000000'));

    await daiToken.transfer(investor.address, tokens('100'));

    return {
      owner,
      investor,
      daiToken,
      dappToken,
      tokenFarm,
    };
  }

  // テスト1
  describe('Mock DAI deployment', () => {
    it('has a name', async () => {
      const { daiToken } = await loadFixture(deployTokenFixture);
      const name = await daiToken.name();
      assert.equal(name, 'Mock DAI Token');
    });
  });
  // テスト2
  describe('Dapp Token deployment', async () => {
    it('has a name', async () => {
      const { dappToken } = await loadFixture(deployTokenFixture);
      const name = await dappToken.name();
      assert.equal(name, 'DApp Token');
    });
  });

  describe('Token Farm deployment', async () => {
    // テスト3
    it('has a name', async () => {
      const { tokenFarm } = await loadFixture(deployTokenFixture);
      const name = await tokenFarm.name();
      assert.equal(name, 'Dapp Token Farm');
    });
    // テスト4
    it('contract has tokens', async () => {
      const { dappToken, tokenFarm } = await loadFixture(deployTokenFixture);
      const balance = await dappToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), tokens('1000000'));
    });
  });

  describe('Farming tokens', async () => {
    it('rewards investors for staking mDai tokens', async () => {
      const { daiToken, dappToken, tokenFarm, investor, owner } =
        await loadFixture(deployTokenFixture);
      let result;

      // テスト5. ステーキングの前に投資家の残高を確認する
      result = await daiToken.balanceOf(investor.address);
      assert.equal(
        result.toString(),
        tokens('100'),
        'investor Mock DAI wallet balance correct before staking',
      );

      // テスト6. 偽のDAIトークンを確認する
      await daiToken
        .connect(investor)
        .approve(tokenFarm.address, tokens('100'));
      await tokenFarm.connect(investor).stakeTokens(tokens('100'));

      // テスト7. ステーキング後の投資家の残高を確認する
      result = await daiToken.balanceOf(investor.address);
      assert.equal(
        result.toString(),
        tokens('0'),
        'investor Mock DAI wallet balance correct after staking',
      );

      // テスト8. ステーキング後のTokenFarmの残高を確認する
      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        tokens('100'),
        'Token Farm Mock DAI balance correct after staking',
      );

      // テスト9. 投資家がTokenFarmにステーキングした残高を確認する
      result = await tokenFarm.stakingBalance(investor.address);
      assert.equal(
        result.toString(),
        tokens('100'),
        'investor staking balance correct after staking',
      );

      // テスト10. ステーキングを行った投資家の状態を確認する
      result = await tokenFarm.isStaking(investor.address);
      assert.equal(
        result.toString(),
        'true',
        'investor staking status correct after staking',
      );

      // ----- 追加するテストコード ------ //

      // トークンを発行する
      await tokenFarm.issueTokens();

      // トークンを発行した後の投資家の Dapp 残高を確認する
      result = await dappToken.balanceOf(investor.address);
      assert.equal(
        result.toString(),
        tokens('100'),
        'investor DApp Token wallet balance correct after staking',
      );

      // あなた（owner）のみがトークンを発行できることを確認する（もしあなた以外の人がトークンを発行しようとした場合、却下される）
      await expect(tokenFarm.connect(investor).issueTokens()).to.be.reverted;

      // トークンをアンステーキングする
      await tokenFarm.connect(investor).unstakeTokens(tokens('60'));

      // テスト11. アンステーキングの結果を確認する
      result = await daiToken.balanceOf(investor.address);
      assert.equal(
        result.toString(),
        tokens('60'),
        'investor Mock DAI wallet balance correct after staking',
      );

      // テスト12.投資家がアンステーキングした後の Token Farm 内に存在する偽の Dai 残高を確認する
      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        tokens('40'),
        'Token Farm Mock DAI balance correct after staking',
      );

      // テスト13. 投資家がアンステーキングした後の投資家の残高を確認する
      result = await tokenFarm.stakingBalance(investor.address);
      assert.equal(
        result.toString(),
        tokens('40'),
        'investor staking status correct after staking',
      );

      // テスト14. 投資家がアンステーキングした後の投資家の状態を確認する
      result = await tokenFarm.isStaking(investor.address);
      assert.equal(
        result.toString(),
        'false',
        'investor staking status correct after staking',
      );
    });
  });
});