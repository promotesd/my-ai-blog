# Aliyun Deployment

目标：用最少步骤部署和更新 `xiaodudu.top`。生产环境使用 Docker Compose 运行 MySQL、Redis、Spring Boot 和前端静态容器，宿主机 Nginx 负责域名、HTTPS 和反向代理。

## 2C2G 是否够用

2 核 2G 可以跑低访问量个人站，但偏紧。当前生产配置已经限制了 MySQL、Redis、Spring Boot JVM 和前端容器内存，并且脚本会串行构建镜像，避免 Maven 和 Node 同时吃内存。

建议在阿里云加 2G swap：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

访问量上来后，优先升级到 2 核 4G。

## 首次部署

DNS 先解析到阿里云公网 IP：

```text
A  @    服务器公网 IP
A  www  服务器公网 IP
```

服务器目录固定为：

```bash
/opt/my-ai-blog
```

首次部署：

```bash
sudo apt update
sudo apt install -y git curl openssl nginx certbot python3-certbot-nginx docker.io docker-compose-v2
sudo systemctl enable --now docker nginx
```

> Ubuntu 26.04 的 Compose v2 包名是 `docker-compose-v2`；如果你的系统源提供的是 `docker-compose-plugin`，二者任选其一即可，最终命令都应支持 `docker compose version`。

```bash
cd /opt/my-ai-blog
chmod +x deploy/deploy-prod.sh deploy/update-prod.sh
APP_DIR=/opt/my-ai-blog ./deploy/deploy-prod.sh
```

脚本会自动生成 `.env.production`，构建镜像，启动容器，并安装 Nginx 站点配置。

开启 HTTPS：

```bash
sudo certbot --nginx -d xiaodudu.top -d www.xiaodudu.top
```

## 本地修改后的更新流程

本地改完代码：

```bash
git add .
git commit -m "update site"
git push
```

服务器更新：

```bash
cd /opt/my-ai-blog
./deploy/update-prod.sh
```

更新脚本会：

- `git pull --ff-only`
- 串行 build backend/frontend
- 重启变更后的容器
- 清理旧镜像
- 自动检查 `http://127.0.0.1:8080/api/health`

## 回滚

服务器上回滚到上一个 commit：

```bash
cd /opt/my-ai-blog
git log --oneline -5
git checkout <上一个commit>
./deploy/update-prod.sh
```

回到主分支继续更新：

```bash
git checkout main
git pull --ff-only
./deploy/update-prod.sh
```

## 常用命令

查看容器：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

看后端日志：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f backend
```

手动重启：

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production restart backend
```

验证：

```bash
curl http://127.0.0.1:8080/api/health
curl https://xiaodudu.top/api/health
```

后台：

```text
https://xiaodudu.top/xhub
admin / admin123
```

## Docker 镜像源问题

如果构建时出现 `403 Forbidden` 或 `failed to resolve source metadata`，说明 Docker 镜像源不可用。可以清空坏的 mirror：

```bash
sudo mkdir -p /etc/docker
printf '{\n  "registry-mirrors": []\n}\n' | sudo tee /etc/docker/daemon.json
sudo systemctl daemon-reload
sudo systemctl restart docker
```

然后重新执行：

```bash
./deploy/update-prod.sh
```
