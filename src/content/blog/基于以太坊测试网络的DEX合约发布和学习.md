---
title: "基于以太坊测试网络的DEX合约发布和学习"
description: "在Sepolia测试网发行ERC-20代币、编写DEX合约与简易DApp的完整实践记录与踩坑总结。"
date: 2025-12-09
tags:
  - "区块链"
  - "以太坊"
  - "Solidity"
  - "DeFi"
  - "DApp"
authors:
  - "bx"
draft: false
slug: "ethereum-dex-sepolia"
cover: "/blog/ethereum-dex-sepolia/image.png"
password: "33661"
---
<meta name="referrer" content="no-referrer">

# 基于以太坊测试网络的DEX合约发布和学习

本篇文章主要展示了基于以太坊测试网Sep编写合约代码，发行代币，以及DEX合约编写和简易Dapp的编写

主要是完成我的区块链课程和简单地加深对于区块链这个领域的理解，这里在博客分享一下过程和记录概念

# 基础准备

## MetaMask

小狐狸

![image.png](/blog/ethereum-dex-sepolia/image.png)

> **MetaMask**：**你的钱由你自己保管**。所有的资产数据都在区块链上，MetaMask 只是一个“钥匙管理器”。**如果你弄丢了助记词（12个单词），MetaMask 官方也帮不了你，你的钱就永远丢失了。**
> 

需要先创建一个钱包去完成后续实验，就像我下面这样MetaMask是我们在区块链中资产管理的一个钱包，我们可以把我们的ETH等转到MetaMask的钱包地址中统一管理

![image.png](/blog/ethereum-dex-sepolia/image%201.png)

## 以太坊测试网

### 测试代币领取

本次实验采用的是Sepolia

> *Sepolia是以太坊官方测试网络之一。它和以太坊主网规则/环境很像，但使用的是没有真实价值的测试 ETH（Sepolia ETH），专门给开发和测试用。*
> 

在MetaMask上添加

![image.png](/blog/ethereum-dex-sepolia/image%202.png)

这里我们去这个水龙头领取一下

> 这个原理了解了一下，就是说，为了防止有人用机器人疯狂刷币，传统的防御手段是“只有你有钱（主网有 ETH）才能领”。但 pk910 认为这阻碍了新手开发者，所以他设计了一套只有你付出了计算努力（挖矿）才能领”的机制，采用了**浏览器挖矿 ，所以我们在获取这个代币的时候会发现cpu占用马上上来了**
> 

[Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)

![image.png](/blog/ethereum-dex-sepolia/image%203.png)

选择确认

![image.png](/blog/ethereum-dex-sepolia/image%204.png)

交易被确认

TX:[0xe2f3103668aff5d8c4f4861acfb1d6b5c49eaa51b05f6b5e73635f6d5be62888](https://sepolia.etherscan.io/tx/0xe2f3103668aff5d8c4f4861acfb1d6b5c49eaa51b05f6b5e73635f6d5be62888)

可以再ETH的测试网查看到

![image.png](/blog/ethereum-dex-sepolia/image%205.png)

# 合约编写&代币发行

## 代币创建（TokenA&TokenB）

这里之前需要了解一下代币标准—ERC-20

[ERC-20 代币标准 | ethereum.org](https://ethereum.org/zh/developers/docs/standards/tokens/erc-20/)

### 创建代币—BXcoin

在Remix IDE中创建ERC20项目

> Remix IDE 是以太坊官方推荐的、基于浏览器的智能合约开发工具，一站式的SOL开发环境
> 

在文件浏览器创建sol文件

![image.png](/blog/ethereum-dex-sepolia/image%206.png)

这里编写合约

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

编写代码完成后需要点击“Compile”检测一下

![image.png](/blog/ethereum-dex-sepolia/image%207.png)

在这个sep测试网络部署

首先需要连接MetaMask

![image.png](/blog/ethereum-dex-sepolia/image%208.png)

部署合约

![image.png](/blog/ethereum-dex-sepolia/image%209.png)

确认之后，等一段时间回到回复

![image.png](/blog/ethereum-dex-sepolia/image%2010.png)

交易ID：0x687d258d22429b63e34598c7b1374fddec7bd2432e622fcfa68e3f1814b555fb

我这次案例对应详情如下

[https://sepolia.etherscan.io/tx/0x687d258d22429b63e34598c7b1374fddec7bd2432e622fcfa68e3f1814b555fb](https://sepolia.etherscan.io/tx/0x687d258d22429b63e34598c7b1374fddec7bd2432e622fcfa68e3f1814b555fb)

具体如下

![image.png](/blog/ethereum-dex-sepolia/image%2011.png)

对应合约ID:0x97bd56729310889aD33b2bbC520571303E5BFc33

可以在Explore上看到具体信息

![image.png](/blog/ethereum-dex-sepolia/image%2012.png)

在MetaMask添加我们这个合约代币

进入MetaMask中在Sepolia网络下添加代币，在代币合约地址输入我们刚才的合约地址：

```jsx
0x97bd56729310889aD33b2bbC520571303E5BFc33
```

![image.png](/blog/ethereum-dex-sepolia/image%2013.png)

导入之后的效果就是这样

![image.png](/blog/ethereum-dex-sepolia/image%2014.png)

### 创建代币—DXcoin

在上面的代币基础上，升级了一下

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

开始Deploy，在初始化部署代币选择数量

比如你想一开始就有 100 万枚：在 Remix Deploy 输入：

```tsx
1000000e18
```

![image.png](/blog/ethereum-dex-sepolia/image%2015.png)

然后部署在测试网络上

[Sepolia Transaction Hash: 0xcd0e134314... | Etherscan Sepolia](https://sepolia.etherscan.io/tx/0xcd0e1343143560aa2192418493412e1049022ed65bca9d6b417339048feac439)

![image.png](/blog/ethereum-dex-sepolia/image%2016.png)

具体合约页面

![image.png](/blog/ethereum-dex-sepolia/image%2017.png)

导入MetaMask中Sep网络

![image.png](/blog/ethereum-dex-sepolia/image%2018.png)

## Base DEX合约

DEX 合约（Decentralized Exchange Contract，去中心化交易所合约）是 DeFi（去中心化金融）的核心基础设施。

如果说代币合约是印钞票的机器，那么DEX 合约就是一台自动兑换机。它是一套运行在区块链上的代码，允许用户在没有中间人（如币安、Coinbase 等交易所员工）的情况下，直接进行代币之间的交换。

---

上面我们两个代币合约地址

```tsx
BX:0x97bd56729310889aD33b2bbC520571303E5BFc33
DX:0x98b129D0fa6D052ec1ba74b7541D1a63aD614e75
```

对应编写DEX合约代码如下

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

进行一下合约代码分析，后续升级基于这个框架

1. **添加流动性 (Add Liquidity)**

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

要想能交易，池子里必须先有钱。这个功能允许“做市商”把 TokenA 和 TokenB 存入合约

1. **核心定价引擎**

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

遵循公式：`x * y = k` 

1. **交易功能** 

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

用户卖出 B，买入 A这样的逻辑

对应编译检查通过之后，准备部署

![image.png](/blog/ethereum-dex-sepolia/image%2019.png)

根据逻辑填入参数

```tsx
0x97bd56729310889aD33b2bbC520571303E5BFc33,0x98b129D0fa6D052ec1ba74b7541D1a63aD614e75
```

![image.png](/blog/ethereum-dex-sepolia/image%2020.png)

确认是测试网络无误后

这里可以看一下Remix IDE中output log

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

ok成功部署

对应信息：

[](https://sepolia.etherscan.io/tx/0x3b2d5936073cd8ee79d0d8faff31868aa7d874827f8dd76346be47cf345da60e)

![image.png](/blog/ethereum-dex-sepolia/image%2021.png)

对应合约地址：0xb3561158AcD93048448D1f1F2f484C5FAB31548c

[Address: 0xb3561158...fab31548c | Etherscan Sepolia](https://sepolia.etherscan.io/address/0xb3561158acd93048448d1f1f2f484c5fab31548c#code)

![image.png](/blog/ethereum-dex-sepolia/image%2022.png)

我们就按 “500 + 500” 加入池子

对于DX币

注意这里要在这里

![image.png](/blog/ethereum-dex-sepolia/image%2023.png)

执行approve

```tsx
0xb3561158AcD93048448D1f1F2f484C5FAB31548c,500e18

---
spender（DEX 地址）
0xb3561158AcD93048448D1f1F2f484C5FAB31548c
value（授权数量）
500e18
```

支出请求，这里点确认

![image.png](/blog/ethereum-dex-sepolia/image%2024.png)

具体交易：

[https://sepolia.etherscan.io/tx/0x764503675c07221866de39e8b3a2b7c099fb90be0fd1a3bf7b5df22f8fe6f180](https://sepolia.etherscan.io/tx/0x764503675c07221866de39e8b3a2b7c099fb90be0fd1a3bf7b5df22f8fe6f180)

![image.png](/blog/ethereum-dex-sepolia/image%2025.png)

对于BX币的账户

![image.png](/blog/ethereum-dex-sepolia/image%2026.png)

[https://sepolia.etherscan.io/tx/0x63eff085a8c5b52ec0d300baad5bd27f11ac209e6cbf9b6d0e194157adc760df](https://sepolia.etherscan.io/tx/0x63eff085a8c5b52ec0d300baad5bd27f11ac209e6cbf9b6d0e194157adc760df)

对应如下

![image.png](/blog/ethereum-dex-sepolia/image%2027.png)

使用Add Liquidity方法

![image.png](/blog/ethereum-dex-sepolia/image%2028.png)

测试网上交易ID:0xc11bdb873232559b6336beebe9c8f856ca9d8f067cbf316bf8e57aa902354d10

[https://sepolia.etherscan.io/tx/0xc11bdb873232559b6336beebe9c8f856ca9d8f067cbf316bf8e57aa902354d10](https://sepolia.etherscan.io/tx/0xc11bdb873232559b6336beebe9c8f856ca9d8f067cbf316bf8e57aa902354d10)

![image.png](/blog/ethereum-dex-sepolia/image%2029.png)

这里成功入池了

还可以回到回 Remix 点 reserveA / reserveB

![image.png](/blog/ethereum-dex-sepolia/image%2030.png)

符合预期

然后再approve 10 BX 给 DEX2

![image.png](/blog/ethereum-dex-sepolia/image%2031.png)

具体交易信息

[https://sepolia.etherscan.io/tx/0xa84a517002c0b66b2706e63a08f428529a7a4ec69ce9f440e49e667ad03f7cc6](https://sepolia.etherscan.io/tx/0xa84a517002c0b66b2706e63a08f428529a7a4ec69ce9f440e49e667ad03f7cc6)

Transaction Hash:

0xa84a517002c0b66b2706e63a08f428529a7a4ec69ce9f440e49e667ad03f7cc6

![image.png](/blog/ethereum-dex-sepolia/image%2032.png)

调用 swapAforB

![image.png](/blog/ethereum-dex-sepolia/image%2033.png)

[](https://sepolia.etherscan.io/tx/0x71152db9cb3206364e764909b2aaf4e177e4aff0fd6d6c7d8ca147b80f4a1351)

Transaction Hash:

0x71152db9cb3206364e764909b2aaf4e177e4aff0fd6d6c7d8ca147b80f4a1351

![image.png](/blog/ethereum-dex-sepolia/image%2034.png)

*在流动性池 reserveA=500 BX、reserveB=500 DX 的情况下，调用 swapAforB 换入 10 BX。根据恒定乘积做市商模型*

```tsx
*x * y = k*
```

*并考虑 0.3% 交易手续费，实际换出约 9.775 DX。Etherscan 交易记录显示 10 BX 从用户地址转入 DEX 合约，同时约 9.775 DX 从 DEX 合约转出至用户地址，验证 swap 逻辑正确执行。*

## Better DEX

新合约代码如下

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

### Approve操作

对于BX Token

[https://sepolia.etherscan.io/tx/0x0ec85fdfe417aeb3e499cb5dd551219a6dc0aba85845f04c4b3d0118376584f1](https://sepolia.etherscan.io/tx/0x0ec85fdfe417aeb3e499cb5dd551219a6dc0aba85845f04c4b3d0118376584f1)

![image.png](/blog/ethereum-dex-sepolia/image%2035.png)

![image.png](/blog/ethereum-dex-sepolia/image%2036.png)

批准

[https://sepolia.etherscan.io/tx/0x58a34bc3b991c1c6cbc1287c4ca4df82af481605022eaa046a3462bbef168083](https://sepolia.etherscan.io/tx/0x58a34bc3b991c1c6cbc1287c4ca4df82af481605022eaa046a3462bbef168083)

![image.png](/blog/ethereum-dex-sepolia/image%2037.png)

在新Advanced DEX 上 addLiquidity

![image.png](/blog/ethereum-dex-sepolia/image%2038.png)

在MetaMask中

![image.png](/blog/ethereum-dex-sepolia/image%2039.png)

交易链接

[https://sepolia.etherscan.io/tx/0x5e35204d115a174e433d851fa25e6853e4184c012d4fb5395c9a8ad9f076cef3](https://sepolia.etherscan.io/tx/0x5e35204d115a174e433d851fa25e6853e4184c012d4fb5395c9a8ad9f076cef3)

![image.png](/blog/ethereum-dex-sepolia/image%2040.png)

现在池子里面有资金了

### swapBforA

对于换币功能，我们测试如下

```tsx
amountBIn:10e18
minOut:9.5e18
deadline:9999999999
```

![image.png](/blog/ethereum-dex-sepolia/image%2041.png)

交易ID:0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4

交易链接

[https://sepolia.etherscan.io/tx/0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4](https://sepolia.etherscan.io/tx/0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4)

![image.png](/blog/ethereum-dex-sepolia/image%2042.png)

可以看到流动变化

![image.png](/blog/ethereum-dex-sepolia/image%2043.png)

### GETAMOUNTOUT功能

调用GETAMOUNTOUT

![image.png](/blog/ethereum-dex-sepolia/image%2044.png)

具体LOG

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

滑点保护 minOut测试

我现在getAmountOut计算一下

```tsx
amountIn:10e18
reserveIn:290350679097977223603
reserveOut:310000000000000000000

---结果
0:
uint256: amountOut 10291332615799273026
```

根据计算结果，我们minOut大于10.3e18就会触发，输入参数，最后触发minOut

```tsx
amountAIn:10e18
minOut:11e18
deadline:9999999999
```

![image.png](/blog/ethereum-dex-sepolia/image%2045.png)

### 超时测试

对于新增的合约代码逻辑中，超时逻辑检测和展示

首先参数设置如下

```tsx
amountAIn:10e18
minOut:1e18
deadline:9999999999
```

正常

![image.png](/blog/ethereum-dex-sepolia/image%2046.png)

我们故意测试

```tsx
amountAIn:10e18
minOut:1e18
deadline:1
```

报错如下

![image.png](/blog/ethereum-dex-sepolia/image%2047.png)

弹窗里明确写了 `execution reverted: "expired"`，说明你把 `deadline=1` 这种过期时间传进去后，被 `require(block.timestamp <= deadline)` 拦住了。

功能测试符合预期

### 构造函数 token 地址检测

构造函数 token 地址检测测试,对应合约逻辑代码,可以看到合约构造函数中加了两个检测

```tsx
constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "zero address");
        require(_tokenA != _tokenB, "same token");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
```

1. zero address

```tsx
0x0000000000000000000000000000000000000000
0x97bd56729310889aD33b2bbC520571303E5BFc33
```

![image.png](/blog/ethereum-dex-sepolia/image%2048.png)

可以看到Remix IDE中触发了报错，对于“zero address”不接受，符合预期

1. same address

```tsx
0x97bd56729310889aD33b2bbC520571303E5BFc33
0x97bd56729310889aD33b2bbC520571303E5BFc33
```

![image.png](/blog/ethereum-dex-sepolia/image%2049.png)

可以看到Remix IDE中触发了报错，对于“same token”不接受，符合预期

## Final DEX

最终的DEX，总的来说

这个Final DEX部分选择并实现了“价格更新保护”方向，通过在 swap 中引入 minOut 滑点保护和 deadline 截止时间机制，降低三明治/MEV 导致的成交价格偏离风险；

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

相较于我们上一个DEX，我们现在新增了

LP 份额 / removeLiquidity / sync reserves / ReentrancyGuard等功能

### 部署合约

我们继续部署新的合约在测试网络上

![image.png](/blog/ethereum-dex-sepolia/image%2050.png)

Details如下

![image.png](/blog/ethereum-dex-sepolia/image%2051.png)

新合约地址

```tsx
0xc03bA12283e12BAF76D5507a146EA24C35D39a10
```

Approve BX

![image.png](/blog/ethereum-dex-sepolia/image%2052.png)

https://sepolia.etherscan.io/tx/0x5da7b05342b7d0539b2b3890dd6fd00a41b6c3e97956b403ce434c1c3b815caa

![image.png](/blog/ethereum-dex-sepolia/image%2053.png)

### Approve操作

Approve DX

![image.png](/blog/ethereum-dex-sepolia/image%2054.png)

https://sepolia.etherscan.io/tx/0x8f7ae9b20bcf5d7fa866eb045688e0d800538c714b5f6461c6c8d545882addc4

![image.png](/blog/ethereum-dex-sepolia/image%2055.png)

进行ADDliquidity

![image.png](/blog/ethereum-dex-sepolia/image%2056.png)

[https://sepolia.etherscan.io/tx/0x427892ecc22e6fe72d3095cf386f4d07feadfb8be9d0f908f3ecefd92784f812](https://sepolia.etherscan.io/tx/0x427892ecc22e6fe72d3095cf386f4d07feadfb8be9d0f908f3ecefd92784f812)

### LP 份额

LP 份额（shares/totalShares）功能体现

我的MetaMask中以太坊地址为

```tsx
0xcd17778b7ddd0a0529388a9db9e4cc1e65b66d4e
```

我们测试LP 份额（shares/totalShares）

- shares(0xcd17778b7ddd0a0529388a9db9e4cc1e65b66d4e)
- totalShares

![image.png](/blog/ethereum-dex-sepolia/image%2057.png)

符合预期

这也说明了我的地址当前持有 **全部 LP 份额**

我是唯一的流动性提供者

removeLiquidity体现

接着上面的基础

这里测试，比如我想退 10% 流动性：

```tsx
我原先拥有 ：100000000000000000000
这里remove：10000000000000000000
```

![image.png](/blog/ethereum-dex-sepolia/image%2058.png)

交易细节

![image.png](/blog/ethereum-dex-sepolia/image%2059.png)

[https://sepolia.etherscan.io/tx/0x4ac87ab82f616134119cb829985ba3fae87c0d8be1d3fb4a9f0ba76e359ac08b](https://sepolia.etherscan.io/tx/0x4ac87ab82f616134119cb829985ba3fae87c0d8be1d3fb4a9f0ba76e359ac08b)

![image.png](/blog/ethereum-dex-sepolia/image%2060.png)

可以看到这里

![image.png](/blog/ethereum-dex-sepolia/image%2061.png)

与上面对比，数值全部减小 10%符合预期

这里我们再做一个测试，尝试输入值大于shares

![image.png](/blog/ethereum-dex-sepolia/image%2062.png)

minA/minB 保护 LP 退出时的最小可得资产，防止被抢跑/价格波动导致实际到账过低。

### sync reserves

sync reserves体现

我们先制造不一致 

我再BX中 Transfer 50e18 给 final合约0xc03bA12283e12BAF76D5507a146EA24C35D39a10

![image.png](/blog/ethereum-dex-sepolia/image%2063.png)

[https://sepolia.etherscan.io/tx/0x291acd09fc33b9f14714b5489c7f7c7f9e8451db418bb4b85f4e30eeafdd93db](https://sepolia.etherscan.io/tx/0x291acd09fc33b9f14714b5489c7f7c7f9e8451db418bb4b85f4e30eeafdd93db)

![image.png](/blog/ethereum-dex-sepolia/image%2064.png)

我们对比来看

![image.png](/blog/ethereum-dex-sepolia/image%2065.png)

这上面没变，但是回到BX的balanceof

发现额度是增加的

![image.png](/blog/ethereum-dex-sepolia/image%2066.png)

展示“余额≠reserve”风险

然后我们调用 sync() 修正

我们合约代码
实现了“每次 add/remove/swap 后自动 `_updateReserves()`”，能保证正常路径下 reserves 一致
对“用户直接 transfer 到池子”这种异常路径，需要一个 `external sync()` 来手动对齐

具体代码应该是

```tsx
 directly to the pool.
    function sync() external nonReentrant {
        _updateReserves();
    }
```

### ReentrancyGuard（防重入)

在合约里做了两个防护点去防重入：

1. `contract FinalDex_bx is ReentrancyGuard`（继承防重入库）

![image.png](/blog/ethereum-dex-sepolia/image%2067.png)

1. 对所有会转账的外部函数加了 `nonReentrant`：`addLiquidity / removeLiquidity / swapAforB / swapBforA`。

![image.png](/blog/ethereum-dex-sepolia/image%2068.png)

![image.png](/blog/ethereum-dex-sepolia/image%2069.png)

本合约继承 ReentrancyGuard，并对所有涉及外部转账的状态修改函数添加 nonReentrant 修饰，避免攻击者在 transfer 回调期间二次进入同一函数导致份额/储备被重复结算；在重入测试中二次调用直接 revert，证明防护生效。

## Dapp

> $\text{DApp} = \text{前端界面 (User Interface)} + \text{智能合约 (Smart Contracts)}$
> 

就是区块链领域的app，基于智能合约

我们具体配置信息

```tsx
// TODO: Replace with actual deployed contract addresses
export const DEX_CONTRACT_ADDRESS = "0xc03bA12283e12BAF76D5507a146EA24C35D39a10";
export const TOKEN_A_ADDRESS = "0x97bd56729310889aD33b2bbC520571303E5BFc33";
export const TOKEN_B_ADDRESS = "0x98b129D0fa6D052ec1ba74b7541D1a63aD614e75";
```

做了一个现代化风格的Dapp，基于最后的Final DEX,支持i18n

具体代码

[https://github.com/bx33661/Ethereum-Learning](https://github.com/bx33661/Ethereum-Learning)

连接Wallet页面，采用的TypeScript中的库，支持MetaMask授权连接

先连上钱包执行后续操作

![image.png](/blog/ethereum-dex-sepolia/image%2070.png)

兑换（swap）页面

![image.png](/blog/ethereum-dex-sepolia/image%2071.png)

功能使用

[https://www.notion.so](https://www.notion.so)

授权之后可以直接执行兑换操作，这里直接兑换100

交易细节如下

[https://sepolia.etherscan.io/tx/0x5ddf79bf6f7c0ab6e9688cf8480f4ec2f85be98202f5751b407abd00a4343ba2](https://sepolia.etherscan.io/tx/0x5ddf79bf6f7c0ab6e9688cf8480f4ec2f85be98202f5751b407abd00a4343ba2)

流动性页面

![image.png](/blog/ethereum-dex-sepolia/image%2072.png)
