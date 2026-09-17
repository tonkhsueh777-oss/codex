const test = require('node:test');
const assert = require('node:assert/strict');
for (const file of ['namespace', 'catalog', 'state', 'rules', 'mobile-prompts']) require('../src/' + file + '.js');
const g = globalThis.JQGame;
for (const key of ['bully', 'fire', 'flower', 'jiaqingOrder', 'wangOrder']) {
  test(key + ' presents actual AI-to-human result without mutating game state', () => {
    const s = g.createGameState({rng: () => .5});
    s.phase = 'action'; s.currentPlayerIndex = 1;
    const actor = s.players[1], target = s.players[0];
    const card = {...g.buildDeckDefinition().find(c => c.key === key), runtimeId: 'test'};
    actor.hand = [card]; target.hand = [{name: '实际烧牌', runtimeId: 'burn'}];
    actor.position = 'mengxia'; target.position = 'madou';
    actor.treasures = {goldSeal: 1, sword: 0, gun: 0, pomelo: 0};
    target.treasures = {goldSeal: 0, sword: 0, gun: 0, pomelo: 1};
    const result = card.type === 'trump'
      ? g.playTrumpCard(s, actor.id, 'test', target.id, 'goldSeal', 'pomelo')
      : g.playTacticCard(s, actor.id, 'test', target.id, () => 0);
    assert.equal(result.ok, true);
    const before = JSON.stringify(s);
    const view = g.MobilePrompts.special(card, result, s, actor.id);
    const action = key === 'flower' ? '强制与玩家（你）交换位置' : card.type === 'trump' ? '强制与玩家（你）交换圣物' : '指定玩家（你）';
    assert.equal(view.activation, `AI玩家甲发动【${card.name}】\n${action}`);
    assert.equal(JSON.stringify(s), before);
    const expected = {
      bully: '玩家（你）\n下一个完整回合无法行动',
      fire: '玩家（你）的\n【实际烧牌】\n已被烧毁\n\n玩家（你）下一回合\n不会自动补牌至3张',
      flower: 'AI玩家甲移动到【麻豆古镇】\n玩家（你）移动到【艋舺】\n\n交换完成',
      jiaqingOrder: 'AI玩家甲交出【嘉庆王金印】\n玩家（你）交出【文旦柚】\n\n圣物交换完成',
      wangOrder: 'AI玩家甲交出【嘉庆王金印】\n玩家（你）交出【文旦柚】\n\n圣物交换完成'
    };
    assert.equal(view.displayResult, `${view.activation}\n\n${expected[key]}`);
  });
}
