# v0.7.0 版本与验证范围

从[本包工作台](../app/three-view-workbench.html)打开。更新前可导出当前模型 JSON 备份，现有公开示例可继续导入。

离线流程包括导入、三视图、2D／3D 预览、图纸导出和撤销。生成流程用模拟接口验证，在线 AI 结果仍需对照原图。具体用法见[题图辅助](source-observations.zh-CN.md)。

跨视图线索使用同一张合成图做过一次开关对照，Argon 的两份首次回复得到相同的正确几何。整体首次生成成功率仍待验证。

程序体积与哈希见 [BUILD-BASELINE.json](../BUILD-BASELINE.json)。可用 [SHA256SUMS.txt](../SHA256SUMS.txt) 校验整包文件。
