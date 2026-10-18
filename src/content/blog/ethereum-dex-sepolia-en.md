---
title: "Deploying and Studying a DEX Contract on an Ethereum Testnet"
description: "A hands-on record of issuing ERC-20 tokens on Sepolia, writing DEX contracts, and building a simple DApp, including lessons learned."
date: 2025-12-09T00:00:00.000Z
tags:
  - "Blockchain"
  - "Ethereum"
  - "Solidity"
  - "DeFi"
  - "DApp"
authors:
  - "bx"
draft: false
slug: "ethereum-dex-sepolia-en"
cover: "/blog/ethereum-dex-sepolia/step-00.png"
lang: "en"
translationKey: "ethereum-dex-sepolia"
---

# Deploying and Studying a DEX Contract on an Ethereum Test Network

This article mainly demonstrates writing contract code, issuing tokens, writing a DEX contract, and building a simple DApp on the Ethereum Sep test network.

The main purpose is to complete my blockchain course and deepen my understanding of the field of blockchain. I am sharing and recording the process and concepts here on my blog.

# Preparation

## MetaMask

The little fox

![image.png](/blog/ethereum-dex-sepolia/step-00.png)

> **MetaMask**: **You hold your own money.** All asset data is on the blockchain; MetaMask is only a “key manager.” **If you lose your recovery phrase (12 words), even MetaMask's official team cannot help you, and your money is lost forever.**
>

First, you need to create a wallet for the subsequent experiments. As shown below, MetaMask is a wallet for managing assets on the blockchain. We can transfer ETH and other assets to our MetaMask wallet address for centralized management.

![image.png](/blog/ethereum-dex-sepolia/step-01.png)

## Ethereum Test Network

### Claiming Test Tokens

This experiment uses Sepolia.

> *Sepolia is one of Ethereum's official test networks. Its rules and environment are similar to Ethereum mainnet, but it uses test ETH (Sepolia ETH) with no real value, specifically for development and testing.*
>

Add it in MetaMask.

![image.png](/blog/ethereum-dex-sepolia/step-02.png)

Here, we will claim some tokens from this faucet.

> I looked into the principle: to prevent people from using bots to farm coins, the traditional defense is “you can claim only if you have money (ETH on mainnet).” But pk910 thought this obstructed new developers, so they designed a mechanism where you can claim only after expending computational effort (mining). It uses **browser mining, so you will notice CPU usage rise immediately while obtaining these tokens.**
>

[Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)

![image.png](/blog/ethereum-dex-sepolia/step-03.png)

Select Confirm.

![image.png](/blog/ethereum-dex-sepolia/step-04.png)

The transaction is confirmed.

TX: [0xe2f3103668aff5d8c4f4861acfb1d6b5c49eaa51b05f6b5e73635f6d5be62888](https://sepolia.etherscan.io/tx/0xe2f3103668aff5d8c4f4861acfb1d6b5c49eaa51b05f6b5e73635f6d5be62888)

It can be viewed on the ETH test network.

![image.png](/blog/ethereum-dex-sepolia/step-05.png)

# Writing Contracts & Issuing Tokens

## Creating Tokens (TokenA & TokenB)

First, we need to learn about the token standard—ERC-20.

[ERC-20 Token Standard | ethereum.org](https://ethereum.org/zh/developers/docs/standards/tokens/erc-20/)

### Create a Token—BXcoin

Create an ERC20 project in Remix IDE.

> Remix IDE is a browser-based smart contract development tool recommended by Ethereum, providing an all-in-one SOL development environment.
>

Create a .sol file in the file explorer.

![image.png](/blog/ethereum-dex-sepolia/step-06.png)

Write the contract here.

```tsx
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenA_bx is ERC20 {

    constructor() ERC20("BXCoin", "BX") {
        _mint(msg.sender, 1000 * 10**18);
    }
}
```

After writing the code, click “Compile” to check it.

![image.png](/blog/ethereum-dex-sepolia/step-07.png)

Deploy it on the Sep test network.

First, connect MetaMask.

![image.png](/blog/ethereum-dex-sepolia/step-08.png)

Deploy the contract.

![image.png](/blog/ethereum-dex-sepolia/step-09.png)

After confirming, wait for a while and return to the response.

![image.png](/blog/ethereum-dex-sepolia/step-10.png)

Transaction ID: 0x687d258d22429b63e34598c7b1374fddec7bd2432e622fcfa68e3f1814b555fb

The details for my example this time are as follows.

[https://sepolia.etherscan.io/tx/0x687d258d22429b63e34598c7b1374fddec7bd2432e622fcfa68e3f1814b555fb](https://sepolia.etherscan.io/tx/0x687d258d22429b63e34598c7b1374fddec7bd2432e622fcfa68e3f1814b555fb)

As follows:

![image.png](/blog/ethereum-dex-sepolia/step-11.png)

Corresponding contract ID: 0x97bd56729310889aD33b2bbC520571303E5BFc33

You can see the details on Explore.

![image.png](/blog/ethereum-dex-sepolia/step-12.png)

Add this contract token to MetaMask.

In MetaMask, add a token under the Sepolia network and enter the contract address we just obtained:

```jsx
0x97bd56729310889aD33b2bbC520571303E5BFc33
```

![image.png](/blog/ethereum-dex-sepolia/step-13.png)

This is what it looks like after importing.

![image.png](/blog/ethereum-dex-sepolia/step-14.png)

### Create a Token—DXcoin

This is an upgrade based on the token above.

```tsx
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenB_dx is ERC20, Ownable {
    // faucet: 每个地址只能领一次
    mapping(address => bool) public claimed;

    constructor(uint256 initialSupply)
        ERC20("DXcoin", "DX")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    /// @notice 管理员增发（用于测试/补充流动性）
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice 用户自毁代币
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice faucet：测试网每个地址免费领 100 DX（只能领一次）
    function faucet() external {
        require(!claimed[msg.sender], "already claimed");
        claimed[msg.sender] = true;
        _mint(msg.sender, 100 * 10**decimals());
    }
}

```

Start Deploy. Select the quantity when initializing the token deployment.

For example, if you want to start with 1 million tokens, enter this in Remix Deploy:

```tsx
1000000e18
```

![image.png](/blog/ethereum-dex-sepolia/step-15.png)

Then deploy it on the test network.

[Sepolia Transaction Hash: 0xcd0e134314... | Etherscan Sepolia](https://sepolia.etherscan.io/tx/0xcd0e1343143560aa2192418493412e1049022ed65bca9d6b417339048feac439)

![image.png](/blog/ethereum-dex-sepolia/step-16.png)

The specific contract page.

![image.png](/blog/ethereum-dex-sepolia/step-17.png)

Import it into MetaMask's Sep network.

![image.png](/blog/ethereum-dex-sepolia/step-18.png)

## Base DEX Contract

A DEX contract (Decentralized Exchange Contract) is core infrastructure for DeFi (decentralized finance).

If a token contract is a money-printing machine, a DEX contract is an automatic exchange machine. It is code running on the blockchain that lets users directly exchange tokens without an intermediary (such as employees of exchanges like Binance or Coinbase).

---

Above are the addresses of our two token contracts.

```tsx
BX:0x97bd56729310889aD33b2bbC520571303E5BFc33
DX:0x98b129D0fa6D052ec1ba74b7541D1a63aD614e75
```

The DEX contract code written for them is as follows.

```tsx
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDex_bx {
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    event AddLiquidity(address indexed user, uint256 amountA, uint256 amountB);
    event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "amount=0");

        require(tokenA.transferFrom(msg.sender, address(this), amountA), "A transfer fail");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "B transfer fail");

        reserveA += amountA;
        reserveB += amountB;

        emit AddLiquidity(msg.sender, amountA, amountB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        public pure returns (uint256)
    {
        require(amountIn > 0, "amountIn=0");
        require(reserveIn > 0 && reserveOut > 0, "no liquidity");

        uint256 amountInWithFee = amountIn * 997;  // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    function swapAforB(uint256 amountAIn) external returns (uint256 amountBOut) {
        amountBOut = getAmountOut(amountAIn, reserveA, reserveB);

        require(tokenA.transferFrom(msg.sender, address(this), amountAIn), "A transfer fail");
        require(tokenB.transfer(msg.sender, amountBOut), "B transfer fail");

        reserveA += amountAIn;
        reserveB -= amountBOut;

        emit Swap(msg.sender, address(tokenA), amountAIn, amountBOut);
    }

    function swapBforA(uint256 amountBIn) external returns (uint256 amountAOut) {
        amountAOut = getAmountOut(amountBIn, reserveB, reserveA);

        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "B transfer fail");
        require(tokenA.transfer(msg.sender, amountAOut), "A transfer fail");

        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit Swap(msg.sender, address(tokenB), amountBIn, amountAOut);
    }
}
```

Let's analyze the contract code; subsequent upgrades will be based on this framework.

1. **Add Liquidity**

```tsx
    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "amount=0");

        require(tokenA.transferFrom(msg.sender, address(this), amountA), "A transfer fail");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "B transfer fail");

        reserveA += amountA;
        reserveB += amountB;

        emit AddLiquidity(msg.sender, amountA, amountB);
    }
```

To trade, the pool must first have funds. This function lets “market makers” deposit TokenA and TokenB into the contract.

1. **Core Pricing Engine**

```tsx
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "amountIn=0");
        require(reserveIn > 0 && reserveOut > 0, "no liquidity");

        // 0.3% fee => user effectively provides 99.7% of amountIn
        uint256 amountInWithFee = amountIn * 997 / 1000;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    }

```

It follows the formula: `x * y = k`

1. **Trading Function**

```tsx
 function swapBforA(
        uint256 amountBIn,
        uint256 minOut,
        uint256 deadline
    ) external returns (uint256 amountAOut) {
        require(block.timestamp <= deadline, "expired");
        require(amountBIn > 0, "amount=0");

        amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut >= minOut, "slippage too high");

        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "B transfer fail");
        require(tokenA.transfer(msg.sender, amountAOut), "A transfer fail");

        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit Swap(msg.sender, address(tokenB), amountBIn, address(tokenA), amountAOut);
    }
}
```

The logic is that a user sells B and buys A.

After compilation succeeds, prepare to deploy.

![image.png](/blog/ethereum-dex-sepolia/step-19.png)

Fill in the parameters according to the logic.

```tsx
0x97bd56729310889aD33b2bbC520571303E5BFc33,0x98b129D0fa6D052ec1ba74b7541D1a63aD614e75
```

![image.png](/blog/ethereum-dex-sepolia/step-20.png)

After confirming that the test network is selected correctly,

you can check the output log in Remix IDE.

```tsx
[block:9750096 txIndex:18]from: 0xcd1...66d4eto: SimpleDex_bx.(constructor)value: 0 weidata: 0x608...14e75logs: 0hash: 0xc28...d31b9
status	1 
transaction hash	0x3b2d5936073cd8ee79d0d8faff31868aa7d874827f8dd76346be47cf345da60e
block hash	0xc282e0ccd1d672ab2a6c05c4e83343ab7359330dfa3be434b3b7855f051d31b9
block number	9750096
contract address	0xb3561158acd93048448d1f1f2f484c5fab31548c
from	0xcd17778b7dDD0a0529388A9dB9e4cc1E65b66d4e
to	SimpleDex_bx.(constructor)
gas	1030578 gas
transaction cost	1021305 gas 
input	0x608...14e75
decoded input	{
	"address _tokenA": "0x97bd56729310889aD33b2bbC520571303E5BFc33",
	"address _tokenB": "0x98b129D0fa6D052ec1ba74b7541D1a63aD614e75"
}
decoded output	 - 
logs	[]
raw logs	[]
view on Etherscan view on Blockscout
Verification process started...
Verifying with Sourcify...
Verifying with Routescan...
Etherscan verification skipped: API key not found in global Settings.

Sourcify verification successful.
https://repo.sourcify.dev/11155111/0xb3561158AcD93048448D1f1F2f484C5FAB31548c/
```

Okay, deployment succeeded.

Corresponding information:

[](https://sepolia.etherscan.io/tx/0x3b2d5936073cd8ee79d0d8faff31868aa7d874827f8dd76346be47cf345da60e)

![image.png](/blog/ethereum-dex-sepolia/step-21.png)

Corresponding contract address: 0xb3561158AcD93048448D1f1F2f484C5FAB31548c

[Address: 0xb3561158...fab31548c | Etherscan Sepolia](https://sepolia.etherscan.io/address/0xb3561158acd93048448d1f1f2f484c5fab31548c#code)

![image.png](/blog/ethereum-dex-sepolia/step-22.png)

We will add liquidity to the pool using “500 + 500.”

For DX coin,

note that you need to do this here.

![image.png](/blog/ethereum-dex-sepolia/step-23.png)

Execute approve.

```tsx
0xb3561158AcD93048448D1f1F2f484C5FAB31548c,500e18

---
spender（DEX 地址）
0xb3561158AcD93048448D1f1F2f484C5FAB31548c
value（授权数量）
500e18
```

Spending request; click Confirm here.

![image.png](/blog/ethereum-dex-sepolia/step-24.png)

Specific transaction:

[https://sepolia.etherscan.io/tx/0x764503675c07221866de39e8b3a2b7c099fb90be0fd1a3bf7b5df22f8fe6f180](https://sepolia.etherscan.io/tx/0x764503675c07221866de39e8b3a2b7c099fb90be0fd1a3bf7b5df22f8fe6f180)

![image.png](/blog/ethereum-dex-sepolia/step-25.png)

For the BX coin account:

![image.png](/blog/ethereum-dex-sepolia/step-26.png)

[https://sepolia.etherscan.io/tx/0x63eff085a8c5b52ec0d300baad5bd27f11ac209e6cbf9b6d0e194157adc760df](https://sepolia.etherscan.io/tx/0x63eff085a8c5b52ec0d300baad5bd27f11ac209e6cbf9b6d0e194157adc760df)

The corresponding result is as follows.

![image.png](/blog/ethereum-dex-sepolia/step-27.png)

Use the Add Liquidity method.

![image.png](/blog/ethereum-dex-sepolia/step-28.png)

Transaction ID on the test network: 0xc11bdb873232559b6336beebe9c8f856ca9d8f067cbf316bf8e57aa902354d10

[https://sepolia.etherscan.io/tx/0xc11bdb873232559b6336beebe9c8f856ca9d8f067cbf316bf8e57aa902354d10](https://sepolia.etherscan.io/tx/0xc11bdb873232559b6336beebe9c8f856ca9d8f067cbf316bf8e57aa902354d10)

![image.png](/blog/ethereum-dex-sepolia/step-29.png)

Liquidity was successfully added to the pool.

You can also return to Remix and check reserveA / reserveB.

![image.png](/blog/ethereum-dex-sepolia/step-30.png)

As expected.

Then approve 10 BX for DEX2.

![image.png](/blog/ethereum-dex-sepolia/step-31.png)

Specific transaction details:

[https://sepolia.etherscan.io/tx/0xa84a517002c0b66b2706e63a08f428529a7a4ec69ce9f440e49e667ad03f7cc6](https://sepolia.etherscan.io/tx/0xa84a517002c0b66b2706e63a08f428529a7a4ec69ce9f440e49e667ad03f7cc6)

Transaction Hash:

0xa84a517002c0b66b2706e63a08f428529a7a4ec69ce9f440e49e667ad03f7cc6

![image.png](/blog/ethereum-dex-sepolia/step-32.png)

Call swapAforB.

![image.png](/blog/ethereum-dex-sepolia/step-33.png)

[](https://sepolia.etherscan.io/tx/0x71152db9cb3206364e764909b2aaf4e177e4aff0fd6d6c7d8ca147b80f4a1351)

Transaction Hash:

0x71152db9cb3206364e764909b2aaf4e177e4aff0fd6d6c7d8ca147b80f4a1351

![image.png](/blog/ethereum-dex-sepolia/step-34.png)

*With reserveA=500 BX and reserveB=500 DX in the liquidity pool, call swapAforB to swap in 10 BX. According to the constant-product market maker model,*

```tsx
*x * y = k*
```

*and accounting for the 0.3% trading fee, approximately 9.775 DX should be received. The Etherscan transaction record shows 10 BX transferred from the user address into the DEX contract, while approximately 9.775 DX was transferred from the DEX contract to the user address, confirming that the swap logic executed correctly.*

## Better DEX

The new contract code is as follows.

```tsx
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract SimpleDex_bx {
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    event AddLiquidity(address indexed user, uint256 amountA, uint256 amountB);
    event Swap(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 amountOut
    );

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "zero address");
        require(_tokenA != _tokenB, "same token");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "amount=0");

        require(tokenA.transferFrom(msg.sender, address(this), amountA), "A transfer fail");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "B transfer fail");

        reserveA += amountA;
        reserveB += amountB;

        emit AddLiquidity(msg.sender, amountA, amountB);
    }

    /// @notice Quote how many tokens you get out for a given input.
    /// @dev Constant-product AMM with 0.3% fee.
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "amountIn=0");
        require(reserveIn > 0 && reserveOut > 0, "no liquidity");

        // 0.3% fee 
        uint256 amountInWithFee = amountIn * 997 / 1000;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    }

    function swapAforB(
        uint256 amountAIn,
        uint256 minOut,
        uint256 deadline
    ) external returns (uint256 amountBOut) {
        require(block.timestamp <= deadline, "expired");
        require(amountAIn > 0, "amount=0");

        amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut >= minOut, "slippage too high");

        require(tokenA.transferFrom(msg.sender, address(this), amountAIn), "A transfer fail");
        require(tokenB.transfer(msg.sender, amountBOut), "B transfer fail");

        reserveA += amountAIn;
        reserveB -= amountBOut;

        emit Swap(msg.sender, address(tokenA), amountAIn, address(tokenB), amountBOut);
    }

    function swapBforA(
        uint256 amountBIn,
        uint256 minOut,
        uint256 deadline
    ) external returns (uint256 amountAOut) {
        require(block.timestamp <= deadline, "expired");
        require(amountBIn > 0, "amount=0");

        amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut >= minOut, "slippage too high");

        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "B transfer fail");
        require(tokenA.transfer(msg.sender, amountAOut), "A transfer fail");

        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit Swap(msg.sender, address(tokenB), amountBIn, address(tokenA), amountAOut);
    }
}
```

### Approve Operation

For BX Token:

[https://sepolia.etherscan.io/tx/0x0ec85fdfe417aeb3e499cb5dd551219a6dc0aba85845f04c4b3d0118376584f1](https://sepolia.etherscan.io/tx/0x0ec85fdfe417aeb3e499cb5dd551219a6dc0aba85845f04c4b3d0118376584f1)

![image.png](/blog/ethereum-dex-sepolia/step-35.png)

![image.png](/blog/ethereum-dex-sepolia/step-36.png)

Approve.

[https://sepolia.etherscan.io/tx/0x58a34bc3b991c1c6cbc1287c4ca4df82af481605022eaa046a3462bbef168083](https://sepolia.etherscan.io/tx/0x58a34bc3b991c1c6cbc1287c4ca4df82af481605022eaa046a3462bbef168083)

![image.png](/blog/ethereum-dex-sepolia/step-37.png)

Add liquidity on the new Advanced DEX.

![image.png](/blog/ethereum-dex-sepolia/step-38.png)

In MetaMask:

![image.png](/blog/ethereum-dex-sepolia/step-39.png)

Transaction link:

[https://sepolia.etherscan.io/tx/0x5e35204d115a174e433d851fa25e6853e4184c012d4fb5395c9a8ad9f076cef3](https://sepolia.etherscan.io/tx/0x5e35204d115a174e433d851fa25e6853e4184c012d4fb5395c9a8ad9f076cef3)

![image.png](/blog/ethereum-dex-sepolia/step-40.png)

The pool now has funds.

### swapBforA

We test the token-swap function as follows.

```tsx
amountBIn:10e18
minOut:9.5e18
deadline:9999999999
```

![image.png](/blog/ethereum-dex-sepolia/step-41.png)

Transaction ID: 0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4

Transaction link:

[https://sepolia.etherscan.io/tx/0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4](https://sepolia.etherscan.io/tx/0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4)

![image.png](/blog/ethereum-dex-sepolia/step-42.png)

The changes in liquidity can be seen.

![image.png](/blog/ethereum-dex-sepolia/step-43.png)

### GETAMOUNTOUT Function

Call GETAMOUNTOUT.

![image.png](/blog/ethereum-dex-sepolia/step-44.png)

The specific LOG:

```tsx
[call]from: 0xcd17778b7dDD0a0529388A9dB9e4cc1E65b66d4eto: SimpleDex_bx.getAmountOut(uint256,uint256,uint256)data: 0x054...e39b3
from	0xcd17778b7dDD0a0529388A9dB9e4cc1E65b66d4e
to	SimpleDex_bx.getAmountOut(uint256,uint256,uint256) 0x5a8e82da5D3Dc9e80b58276e59E4b31c25F97c50
input	0x054...e39b3
output	000000000000000000000000125141181638145313
decoded input	{
	"uint256 amountIn": "10000000000000000000",
	"uint256 reserveIn": "310000000000000000000",
	"uint256 reserveOut": "290350679097977223603"
}
decoded output	{
	"0": "uint256: amountOut 9047086510006665997"
}
logs	[]
raw logs	[]
```

Slippage protection minOut test.

I will now calculate using getAmountOut.

```tsx
amountIn:10e18
reserveIn:290350679097977223603
reserveOut:310000000000000000000

---结果
0:
uint256: amountOut 10291332615799273026
```

Based on the calculation, minOut greater than 10.3e18 will trigger the condition. Enter the parameters, and minOut is ultimately triggered.

```tsx
amountAIn:10e18
minOut:11e18
deadline:9999999999
```

![image.png](/blog/ethereum-dex-sepolia/step-45.png)

### Timeout Test

We test and demonstrate the timeout logic in the newly added contract code.

First, set the parameters as follows.

```tsx
amountAIn:10e18
minOut:1e18
deadline:9999999999
```

Normal.

![image.png](/blog/ethereum-dex-sepolia/step-46.png)

We deliberately test it.

```tsx
amountAIn:10e18
minOut:1e18
deadline:1
```

The following error is reported.

![image.png](/blog/ethereum-dex-sepolia/step-47.png)

The dialog clearly says `execution reverted: "expired"`, showing that after you passed an expiration time such as `deadline=1`, it was blocked by `require(block.timestamp <= deadline)`.

The function test behaved as expected.

### Constructor Token Address Checks

Constructor token address checks: corresponding contract logic. We can see that two checks were added to the contract constructor.

```tsx
constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "zero address");
        require(_tokenA != _tokenB, "same token");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
```

1. Zero address

```tsx
0x0000000000000000000000000000000000000000
0x97bd56729310889aD33b2bbC520571303E5BFc33
```

![image.png](/blog/ethereum-dex-sepolia/step-48.png)

We can see that Remix IDE triggered an error and did not accept “zero address,” as expected.

1. Same address

```tsx
0x97bd56729310889aD33b2bbC520571303E5BFc33
0x97bd56729310889aD33b2bbC520571303E5BFc33
```

![image.png](/blog/ethereum-dex-sepolia/step-49.png)

We can see that Remix IDE triggered an error and did not accept “same token,” as expected.

## Final DEX

Overall, for the final DEX,

this Final DEX section chose and implemented “price update protection.” By introducing minOut slippage protection and a deadline cutoff mechanism in swaps, it reduces the risk of execution-price deviation caused by sandwich attacks / MEV.

```tsx
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleDex_bx (Full Advanced)
 * @notice Constant-product AMM with:
 *  - liquidity shares (LP)
 *  - add/remove liquidity
 *  - swap with fee (0.3%), minOut, deadline
 *  - reserves synced to real balances (anti-direct-transfer mismatch)
 *  - reentrancy protection
 */
contract SimpleDex_bx is ReentrancyGuard {
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    // LP shares
    uint256 public totalShares;
    mapping(address => uint256) public shares;

    event AddLiquidity(address indexed user, uint256 amountA, uint256 amountB, uint256 mintedShares);
    event RemoveLiquidity(address indexed user, uint256 amountA, uint256 amountB, uint256 burnedShares);
    event Swap(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 amountOut
    );

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "zero address");
        require(_tokenA != _tokenB, "same token");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    // -------- internal utils --------

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x < y ? x : y;
    }

    // Babylonian sqrt
    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _updateReserves() private {
        reserveA = tokenA.balanceOf(address(this));
        reserveB = tokenB.balanceOf(address(this));
    }

    // -------- core: add/remove liquidity --------

    function addLiquidity(uint256 amountA, uint256 amountB) external nonReentrant returns (uint256 mintedShares) {
        require(amountA > 0 && amountB > 0, "amount=0");

        // pull tokens in
        require(tokenA.transferFrom(msg.sender, address(this), amountA), "A transfer fail");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "B transfer fail");

        // sync reserves to real balances
        _updateReserves();

        if (totalShares == 0) {
            // first LP sets initial price
            mintedShares = _sqrt(amountA * amountB);
        } else {
            // later LP must add proportionally, mint by min ratio
            uint256 shareA = (amountA * totalShares) / (reserveA - amountA);
            uint256 shareB = (amountB * totalShares) / (reserveB - amountB);
            mintedShares = _min(shareA, shareB);
        }

        require(mintedShares > 0, "shares=0");

        shares[msg.sender] += mintedShares;
        totalShares += mintedShares;

        emit AddLiquidity(msg.sender, amountA, amountB, mintedShares);
    }

    function removeLiquidity(uint256 shareAmount)
        external
        nonReentrant
        returns (uint256 amountAOut, uint256 amountBOut)
    {
        require(shareAmount > 0, "share=0");
        require(shares[msg.sender] >= shareAmount, "not enough shares");

        // compute owed amounts by share ratio
        amountAOut = (shareAmount * reserveA) / totalShares;
        amountBOut = (shareAmount * reserveB) / totalShares;

        require(amountAOut > 0 && amountBOut > 0, "amount=0");

        // burn shares first (effects)
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        // interactions
        require(tokenA.transfer(msg.sender, amountAOut), "A transfer fail");
        require(tokenB.transfer(msg.sender, amountBOut), "B transfer fail");

        _updateReserves();

        emit RemoveLiquidity(msg.sender, amountAOut, amountBOut, shareAmount);
    }

    // -------- pricing --------

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "amountIn=0");
        require(reserveIn > 0 && reserveOut > 0, "no liquidity");

        uint256 amountInWithFee = (amountIn * 997) / 1000; // 0.3% fee
        amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    }

    // -------- swaps with minOut & deadline --------

    function swapAforB(uint256 amountAIn, uint256 minOut, uint256 deadline)
        external
        nonReentrant
        returns (uint256 amountBOut)
    {
        require(block.timestamp <= deadline, "expired");
        require(amountAIn > 0, "amount=0");

        amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut >= minOut, "slippage too high");

        require(tokenA.transferFrom(msg.sender, address(this), amountAIn), "A transfer fail");
        require(tokenB.transfer(msg.sender, amountBOut), "B transfer fail");

        _updateReserves();

        emit Swap(msg.sender, address(tokenA), amountAIn, address(tokenB), amountBOut);
    }

    function swapBforA(uint256 amountBIn, uint256 minOut, uint256 deadline)
        external
        nonReentrant
        returns (uint256 amountAOut)
    {
        require(block.timestamp <= deadline, "expired");
        require(amountBIn > 0, "amount=0");

        amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut >= minOut, "slippage too high");

        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "B transfer fail");
        require(tokenA.transfer(msg.sender, amountAOut), "A transfer fail");

        _updateReserves();

        emit Swap(msg.sender, address(tokenB), amountBIn, address(tokenA), amountAOut);
    }
}

```

Compared with our previous DEX, we have now added

LP shares / removeLiquidity / sync reserves / ReentrancyGuard and other features.

### Deploy the Contract

We will continue by deploying the new contract on the test network.

![image.png](/blog/ethereum-dex-sepolia/step-50.png)

Details are as follows.

![image.png](/blog/ethereum-dex-sepolia/step-51.png)

New contract address:

```tsx
0xc03bA12283e12BAF76D5507a146EA24C35D39a10
```

Approve BX.

![image.png](/blog/ethereum-dex-sepolia/step-52.png)

https://sepolia.etherscan.io/tx/0x5da7b05342b7d0539b2b3890dd6fd00a41b6c3e97956b403ce434c1c3b815caa

![image.png](/blog/ethereum-dex-sepolia/step-53.png)

### Approve Operation

Approve DX.

![image.png](/blog/ethereum-dex-sepolia/step-54.png)

https://sepolia.etherscan.io/tx/0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4

![image.png](/blog/ethereum-dex-sepolia/step-55.png)

Perform ADDliquidity.

![image.png](/blog/ethereum-dex-sepolia/step-56.png)

[https://sepolia.etherscan.io/tx/0x427892ecc22e6fe72d3095cf386f4d07feadfb8be9d0f908f3ecefd92784f812](https://sepolia.etherscan.io/tx/0x427892ecc22e6fe72d3095cf386f4d07feadfb8be9d0f908f3ecefd92784f812)

### LP Shares

The LP shares (shares/totalShares) feature is demonstrated.

My Ethereum address in MetaMask is:

```tsx
0xcd17778b7ddd0a0529388a9db9e4cc1e65b66d4e
```

We test LP shares (shares/totalShares).

- shares(0xcd17778b7ddd0a0529388a9db9e4cc1e65b66d4e)
- totalShares

![image.png](/blog/ethereum-dex-sepolia/step-57.png)

As expected.

This also shows that my address currently holds **all LP shares**.

I am the only liquidity provider.

Demonstrating removeLiquidity

Continuing from the above,

Here, let's test it. For example, suppose I want to withdraw 10% of the liquidity:

```tsx
我原先拥有 ：100000000000000000000
这里remove：10000000000000000000
```

![image.png](/blog/ethereum-dex-sepolia/step-58.png)

Transaction details

![image.png](/blog/ethereum-dex-sepolia/step-59.png)

[https://sepolia.etherscan.io/tx/0x4ac87ab82f616134119cb829985ba3fae87c0d8be1d3fb4a9f0ba76e359ac08b](https://sepolia.etherscan.io/tx/0x4ac87ab82f616134119cb829985ba3fae87c0d8be1d3fb4a9f0ba76e359ac08b)

![image.png](/blog/ethereum-dex-sepolia/step-60.png)

As you can see here,

![image.png](/blog/ethereum-dex-sepolia/step-61.png)

Compared with above, all values decreased by 10%, as expected.

Here we will run another test, attempting to enter a value greater than shares.

![image.png](/blog/ethereum-dex-sepolia/step-62.png)

minA/minB protect the minimum assets obtainable when LPs exit, preventing front-running / price fluctuations from making the actual amount received too low.

### sync reserves

Demonstrating sync reserves.

First, we will create an inconsistency.

I will transfer 50e18 BX to the final contract at 0xc03bA12283e12BAF76D5507a146EA24C35D39a10.

![image.png](/blog/ethereum-dex-sepolia/step-63.png)

[https://sepolia.etherscan.io/tx/0x291acd09fc33b9f14714b5489c7f7c7f9e8451db418bb4b85f4e30eeafdd93db](https://sepolia.etherscan.io/tx/0x291acd09fc33b9f14714b5489c7f7c7f9e8451db418bb4b85f4e30eeafdd93db)

![image.png](/blog/ethereum-dex-sepolia/step-64.png)

Let's compare the values.

![image.png](/blog/ethereum-dex-sepolia/step-65.png)

The value above has not changed, but when we return to BX's balanceOf,

we find that the balance has increased.

![image.png](/blog/ethereum-dex-sepolia/step-66.png)

This demonstrates the “balance ≠ reserve” risk.

Then we call sync() to correct it.

Our contract code
implements “automatically `_updateReserves()` after every add/remove/swap,” ensuring reserves stay consistent during normal flows.
For exceptional flows such as “a user directly transfers to the pool,” a `external sync()` is needed to align them manually.

The specific code should be:

```tsx
 directly to the pool.
    function sync() external nonReentrant {
        _updateReserves();
    }
```

### ReentrancyGuard (reentrancy protection)

Two protections against reentrancy were added to the contract:

1. `contract FinalDex_bx is ReentrancyGuard` (inherits a reentrancy protection library)

![image.png](/blog/ethereum-dex-sepolia/step-67.png)

1. Add `nonReentrant` to all external functions that transfer tokens: `addLiquidity / removeLiquidity / swapAforB / swapBforA`.

![image.png](/blog/ethereum-dex-sepolia/step-68.png)

![image.png](/blog/ethereum-dex-sepolia/step-69.png)

This contract inherits ReentrancyGuard and adds the nonReentrant modifier to every state-modifying function involving external transfers. This prevents an attacker from re-entering the same function during a transfer callback and settling shares/reserves twice. In the reentrancy test, the second call reverted directly, demonstrating that the protection worked.

## DApp

> $\text{DApp} = \text{Frontend Interface (User Interface)} + \text{Smart Contracts (Smart Contracts)}$
>

It is an app in the blockchain domain, based on smart contracts.

Our specific configuration information:

```tsx
// TODO: Replace with actual deployed contract addresses
export const DEX_CONTRACT_ADDRESS = "0xc03bA12283e12BAF76D5507a146EA24C35D39a10";
export const TOKEN_A_ADDRESS = "0x97bd56729310889aD33b2bbC520571303E5BFc33";
export const TOKEN_B_ADDRESS = "0x98b129D0fa6D052ec1ba74b7541D1a63aD614e75";
```

A modern-style DApp was built based on the final DEX, with i18n support.

The specific code:

[https://github.com/bx33661/Ethereum-Learning](https://github.com/bx33661/Ethereum-Learning)

The Wallet connection page uses a library in TypeScript and supports authorized connections through MetaMask.

Connect the wallet first to perform the subsequent operations.

![image.png](/blog/ethereum-dex-sepolia/step-70.png)

Token exchange (swap) page

![image.png](/blog/ethereum-dex-sepolia/step-71.png)

Using the feature

[https://www.notion.so](https://www.notion.so)

After authorization, you can perform token exchanges directly. Here, we exchange 100 directly.

Transaction details are as follows.

[https://sepolia.etherscan.io/tx/0x5ddf79bf6f7c0ab6e9688cf8480f4ec2f85be98202f5751b407abd00a4343ba2](https://sepolia.etherscan.io/tx/0x5ddf79bf6f7c0ab6e9688cf8480f4ec2f85be98202f5751b407abd00a4343ba2)

Liquidity page

![image.png](/blog/ethereum-dex-sepolia/step-72.png)
