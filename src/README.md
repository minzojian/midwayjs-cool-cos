**_为 cool-admin(midway 版)添加一个支持腾讯 COS 的插件_**

该插件以预签名的方式上传文件

**安装**
`npm i midwayjs-cool-cos`

在插件管理中,添加完相关参数后

在上传前先 Post 请求
`dev/admin/base/comm/upload`
参数
fileName 文件名
folder 文件夹

该接口返回 `uploadUrl` 和 `publicUrl`
前者是用来 PUT 请求上传 COS 所用的预签名地址
后者是对应的上传后公开访问的地址,一般是和 CDN 拼起来的地址

有问题加 Q:23471079
