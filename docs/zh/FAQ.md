# 常见问题
 ```
Error: spawn npx ENOENT
```
解决方案：为mcpServer添加PATH环境变量
```
{
  "env": {
    "PATH": "/Users/xxx/.nvm/versions/node/v20.10.0/bin:/bin"
  }
}
```