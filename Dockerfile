FROM node:18-alpine
RUN pnpm i
RUN pnpm run build
# 安装pnpm
COPY dist /app
WORKDIR /app

# 暴露端口
EXPOSE 9593

# 启动服务
CMD ["node", "dist/stdio.js"]