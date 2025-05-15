# 常见问题
## 使用NVM导致Node环境问题
 ```
Error: spawn npx ENOENT
```
解决方案：将nvm的node目录添加到PATH
```
{
  "env": {
    "PATH": "/Users/xxx/.nvm/versions/node/v20.10.0/bin:/bin"
  }
}
```
