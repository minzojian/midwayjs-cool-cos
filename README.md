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

该接口返回 `uploadUrl` , `publicUrl` 以及 `method`
`uploadUrl`用来 PUT 请求上传 COS 所用的预签名地址
`publicUrl`是对应的上传后公开访问的地址,一般是和 CDN 拼起来的地址
`method`是对于 COS 来说，是通过`PUT`的方式请求的

另外，还需要修改一下[前台工程]('https://github.com/cool-team-official/cool-admin-vue/tree/vue3-ts-vite')中`src\cool\modules\upload\components\index.vue#L466`中的相关代码

```
		// 重设上传请求
		async httpRequest(req) {
			const mode = await this.uploadMode();

			// 多种上传请求
			const upload = (file) => {
				let fileName = file.name;
				// 是否以 uuid 重新命名
				if (this._rename) {
					fileName = uuidv4() + "." + last((file.name || "").split("."));
				}
				return new Promise((resolve, reject) => {
					const next = (res) => {
						let headers = {};
						let updateData;
						let uploadUrl;
						let uploadMethod = "POST";
						//如果返回的数据中已经包含了uploadUrl，说明是预签名上传，就直接传文件就好了
						if (res.uploadUrl) {
							uploadUrl = res.uploadUrl;
							updateData = file;
							uploadMethod = res.method || uploadMethod;
						} else {
							uploadUrl = res.host;
							const data = new FormData();
							for (const i in res) {
								if (i != "host") {
									data.append(i, res[i]);
								}
							}

							data.append("key", `app/${fileName}`);
							data.append("file", file);
							headers = {
								headers: {
									"Content-Type": "multipart/form-data"
								}
							};
							updateData = data;
						}

						// 上传
						this.service.base.common
							.request({
								url: uploadUrl,
								method: uploadMethod,
								headers,
								data: updateData,
								onUploadProgress: (e) => {
									if (this.onProgress) {
										e.percent = parseInt((e.loaded / e.total) * 100);
										this.onProgress(e, req.file);
									}
								}
							})
							.then((url) => {
								if (mode === "local") {
									resolve(url);
								} else {
									//如果前边的upload接口返回里包含了publicUrl,就优先使用publicUrl
									resolve(res.publicUrl || `${res.host}/app/${fileName}`);
								}
							})
							.catch((err) => {
								reject(err);
							});
					};

					if (mode == "local") {
						next({
							host: "/upload"
						});
					} else {
						this.service.base.common
							.upload({ fileName: fileName, folder: "/upload" })
							.then((res) => {
								next(res);
							})
							.catch(reject);
					}
				});
			};

			this.loading = true;

			await upload(req.file)
				.then((url) => {
					this._onSuccess({ data: url }, { raw: req.file });
				})
				.catch((err) => {
					console.error("upload error", err);
					this.$message.error(err);

					// 	文件上传失败时的钩子
					if (this.onError) {
						this.onError(err, req.file);
					}
				});

			this.loading = false;
		},
```

有问题加 Q:23471079
