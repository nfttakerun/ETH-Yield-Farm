import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import React, { useEffect, useState } from 'react';

/* ABIファイルをインポートする */
import daiAbi from './abis/DaiToken.json';
import dappAbi from './abis/DappToken.json';
import tokenfarmAbi from './abis/TokenFarm.json';
import './App.css';

function App() {
  /* ユーザーのパブリックウォレットを保存するために使用する状態変数を定義 */
  const [currentAccount, setCurrentAccount] = useState('');

  // 各トークンの残高を保存するために使用する状態変数を定義
  const [currentDaiBalance, setDaiBalance] = useState('0');
  const [currentDappBalance, setDappBalance] = useState('0');

  // フォームの入力値を保存するために使用する状態変数を定義
  const [stakedToken, setStakedToken] = useState('0');
  const [transferAddress, setTransferAddress] = useState('');

  // コントラクトアドレスを記載
  const daiTokenAddress = '0xA159ffeb140Bf4e468275819Ef4Ac259ffef8c32';
  const dappTokenAddress = '0x530E2C9fFbc2311eeEd63cFB27C53953609E9332';
  const tokenfarmAddress = '0x674545249e3b8fA4A627C8B74EB0E401631bd3dc';

  //ウォレットアドレス(コントラクトの保持者)を記載
  const walletAddress = '0xf9d7416d32B3D63Fe4Bf90c66c983248Dc26c624';

  /* ABIの内容を参照する変数を作成 */
  const daiTokenABI = daiAbi.abi;
  const dappTokenABI = dappAbi.abi;
  const tokenfarmABI = tokenfarmAbi.abi;

  // コントラクトのインスタンスを格納する変数
  let daiContract;
  let dappContract;
  let tokenfarmContract;

  // ETHに変換する関数
  function convertToEth(n) {
    return n / 10 ** 18;
  }

  // WEIに変換する関数
  function convertToWei(n) {
    return n * 10 ** 18;
  }

  // 各トークンの残高を取得する関数
  const getBalance = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        // コントラクトのインスタンスを作成
//        const provider = new ethers.providers.Web3Provider(ethereum);
        const provider = new JsonRpcProvider.Web3Provider(ethereum);
        const signer = provider.getSigner();
        console.log(signer);

        daiContract = new ethers.Contract(daiTokenAddress, daiTokenABI, signer);
        dappContract = new ethers.Contract(
          dappTokenAddress,
          dappTokenABI,
          signer,
        );
        tokenfarmContract = new ethers.Contract(
          tokenfarmAddress,
          tokenfarmABI,
          signer,
        );

        // 各トークンの残高を格納
        let daiBalance = await daiContract.balanceOf(currentAccount);
        let dappBalance = await dappContract.balanceOf(currentAccount);
        setDaiBalance(convertToEth(daiBalance));
        setDappBalance(convertToEth(dappBalance));
      }
    } catch (error) {
      console.log(error);
    }
  };

  // stakeする値を格納する関数
  const handleStakeChange = (event) => {
    setStakedToken(event.target.value);
    console.log('staked token is:', event.target.value);
  };

  // stake関数
  const stake = async () => {
    try {
      if (currentAccount !== '') {
        await daiContract.approve(
          tokenfarmContract.address,
          convertToWei(stakedToken).toString(),
        );
        await tokenfarmContract.stakeTokens(
          convertToWei(stakedToken).toString(),
        );
        console.log('value is:', stakedToken);
      }
      console.log('Connect Wallet');
    } catch (error) {
      console.log(error);
    }
  };

  // unstake関数
  const unStake = async () => {
    try {
      if (currentAccount !== '') {
        await tokenfarmContract.unstakeTokens(
          convertToWei(stakedToken).toString(),
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  // transferする先のアドレスを格納する関数
  const handleTransferChange = (event) => {
    setTransferAddress(event.target.value);
    console.log('staked token is:', event.target.value);
  };

  // transfer関数
  const transfer = async (event) => {
    try {
      if (currentAccount !== '') {
        await daiContract.transfer(
          transferAddress,
          convertToWei(100).toString(),
        );
        console.log('Successed to transfer DAI token to:', transferAddress);
      }
      console.log('Connect Wallet');
    } catch (error) {
      console.log(error);
    }
  };

  // ウォレット接続を確認する関数
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
        return;
      } else {
        console.log('We have the ethereum object', ethereum);
      }
      /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認 */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);
        getBalance();
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ウォレットに接続する関数
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.error('Get MetaMask!');
        return;
      }
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('Connected: ', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  // リロードごとにウォレット接続を確認する
  useEffect(() => {
    checkIfWalletIsConnected();
  });

  return (
    <div className="h-screen w-screen flex-col flex">
      <div className="text-ellipsis h-20 w-full flex items-center justify-between bg-black">
        <div className="flex items-center">
          <img src={'farmer.png'} alt="Logo" className="px-5" />;
          <div className="text-white text-3xl">ETH Yield Farm</div>
        </div>
        {currentAccount === '' ? (
          <button
            className="text-white mr-10 px-3 py-1 text-2xl border-solid border-2 border-white flex items-center justify-center"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-gray-400 text-lg pr-5">{currentAccount}</div>
        )}
      </div>
      <div className=" w-screen h-full flex-1 items-center justify-center flex flex-col">
        <div className="w-1/2 h-1/3 flex justify-center items-center pt-36">
          <div className="w-1/2 h-1/2 flex justify-center items-center flex-col">
            <div>Staking Balance</div>
            <div>{currentDaiBalance} DAI</div>
          </div>
          <div className="w-1/2 h-1/2 flex justify-center items-center flex-col">
            <div>Reward Balance</div>
            <div>{currentDappBalance} DAPP</div>
          </div>
        </div>
        <div className="h-1/2 w-1/2 flex justify-start items-center flex-col">
          <div className="flex-row flex justify-between items-end w-full px-20">
            <div className="text-xl">Stake Tokens</div>
            <div className="text-gray-300">
              Balance: {currentDaiBalance} DAI
            </div>
          </div>
          <div className="felx-row w-full flex justify-between items-end px-20 py-3">
            <input
              placeholder="0"
              className="flex items-center justify-start border-solid border-2 border-black w-full h-10 pl-3"
              type="text"
              id="stake"
              name="stake"
              value={stakedToken}
              onChange={handleStakeChange}
            />
            <div className="flex-row flex justify-between items-end">
              <img src={'dai.png'} alt="Logo" className="px-5 h-9 w-18" />
              <div>DAI</div>
            </div>
          </div>
          <div
            className="w-full h-14 bg-blue-500 text-white m-3 flex justify-center items-center"
            onClick={stake}
          >
            Stake!
          </div>
          <div className="text-blue-400" onClick={unStake}>
            UN-STAKE..
          </div>
          {currentAccount.toUpperCase() === walletAddress.toUpperCase() ? (
            <>
              <div className="text-xl pt-20">Transfer 100 DAI</div>
              <div className="felx-row w-full flex justify-between items-end px-20 py-3">
                <input
                  placeholder="0x..."
                  className="flex items-center justify-start border-solid border-2 border-black w-full h-10 pl-3"
                  type="text"
                  id="transfer"
                  name="transfer"
                  value={transferAddress}
                  onChange={handleTransferChange}
                />
              </div>
              <div
                className="w-full h-14 bg-blue-500 text-white m-3 flex justify-center items-center"
                onClick={transfer}
              >
                Transfer!
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
        <div className="flex-1"></div>
      </div>
    </div>
  );
}

export default App;