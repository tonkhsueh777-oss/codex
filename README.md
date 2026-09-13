# 嘉庆君游台湾：御前争霸 V34

V34 = 五张王牌 / 计策牌中央大招动画版。

技能影片对应：
- 嘉庆令 → assets/video/jiaqing-order.mp4
- 王德禄令 → assets/video/wang-order.mp4
- 恶霸王豹 → assets/video/bully.mp4
- 火烧百顺楼 → assets/video/fire.mp4
- 假绿菊花 → assets/video/flower.mp4

五支影片均处理为 6.000 秒。玩家或 AI 成功发动对应王牌 / 计策牌时，会在游戏画面中央播放技能影片，播放期间锁定操作；影片结束后继续原本牌局流程。最后 1 秒会叠加“XX发动”技能标题。

游戏规则、牌组数量、AI逻辑、胜利条件、存档机制沿用 V33，不因技能动画改变。

运行方式：解压后使用静态网页服务器打开 index.html。直接双击 index.html 也可尝试运行，但浏览器对本地文件的媒体/脚本策略不同，建议通过 HTTP 静态服务器运行。
