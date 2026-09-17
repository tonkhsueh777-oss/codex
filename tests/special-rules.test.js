const test = require('node:test');
const assert = require('node:assert/strict');
for (const file of ['namespace', 'catalog', 'state', 'rules', 'storage', 'ai']) require('../src/' + file + '.js');
const g = globalThis.JQGame;
function setup(key, actor = 0) {
  const s = g.createGameState({rng: () => .5});
  s.phase = 'action'; s.currentPlayerIndex = actor;
  const c = g.buildDeckDefinition().find(c => c.key === key);
  s.players[actor].hand = [{...c, runtimeId: 'special'}];
  return s;
}
test('bully skips exactly the next complete turn without drawing', () => {
  const s = setup('bully');
  const r = g.playTacticCard(s, 'human', 'special', 'ai1');
  assert.match(r.message, /AI玩家甲下一完整回合无法行动/);
  s.currentPlayerIndex = 1; s.phase = 'turnStart';
  const before = s.drawPile.length;
  const turn = g.beginTurn(s);
  assert.equal(turn.skipped, true); assert.equal(s.currentPlayerIndex, 2);
  assert.equal(s.drawPile.length, before);
  assert.match(turn.message, /受到【恶霸王豹】影响，本回合跳过/);
  s.currentPlayerIndex = 1; assert.equal(g.beginTurn(s).skipped, false);
});
test('fire burns the actual random card and suppresses only next start refill', () => {
  const s = setup('fire', 1), p = s.players[0];
  p.hand = [{name:'巡游',runtimeId:'a'}, {name:'明察',runtimeId:'b'}];
  const r = g.playTacticCard(s, 'ai1', 'special', 'human', () => .99);
  assert.deepEqual(p.hand.map(c=>c.runtimeId), ['a']);
  assert.equal(p.skipTurns, 0); assert.match(r.message, /AI玩家甲烧毁了玩家（你）的【明察】/);
  s.currentPlayerIndex = 0; s.phase = 'turnStart';
  assert.equal(g.beginTurn(s).cards.length, 0); assert.equal(p.hand.length, 1);
  s.phase = 'turnStart'; assert.equal(g.beginTurn(s).cards.length, 2);
});
test('flower directly swaps positions and reports both journeys', () => {
  const s = setup('flower'); s.players[0].position='mengxia'; s.players[2].position='madou';
  const r = g.playTacticCard(s,'human','special','ai2');
  assert.equal(s.players[0].position,'madou'); assert.equal(s.players[2].position,'mengxia');
  assert.equal(s.players[2].skipTurns,0);
  assert.match(r.message,/玩家（你）：艋舺 → 麻豆古镇/);
  assert.match(r.message,/AI玩家乙：麻豆古镇 → 艋舺/);
});
for (const key of ['jiaqingOrder','wangOrder']) for (const winner of [0,1]) {
  test(key+' immediately checks victory for '+winner, () => {
    const s=setup(key);
    s.players[0].treasures=winner===0?{goldSeal:2,sword:1,gun:1,pomelo:0}:{goldSeal:1,sword:0,gun:0,pomelo:0};
    s.players[1].treasures=winner===1?{goldSeal:0,sword:1,gun:1,pomelo:2}:{goldSeal:0,sword:0,gun:0,pomelo:1};
    const r=g.playTrumpCard(s,'human','special','ai1','goldSeal','pomelo');
    assert.equal(r.ok,true); assert.equal(s.winnerId,s.players[winner].id);
    assert.match(r.message,/嘉庆王金印/); assert.match(r.message,/文旦柚/);
    assert.equal(r.activation, `玩家（你） →【${key==='jiaqingOrder'?'嘉庆令':'王德禄令'}】→ AI玩家甲`);
  });
}
test('fire on empty hand never becomes a skip or removes another card', () => {
  const s=setup('fire'); s.players[1].hand=[];
  const r=g.playTacticCard(s,'human','special','ai1');
  assert.equal(r.ok,true); assert.equal(s.players[1].skipTurns,0);
  assert.match(r.message,/无手牌/);
});
test('saved fire suppression survives reload and expires on a skipped turn', () => {
  const s=setup('fire'); g.playTacticCard(s,'human','special','ai1');
  s.players[1].skipTurns=1;
  let data; const storage={setItem:(_,v)=>data=v,getItem:()=>data};
  g.saveGame(s,storage); const loaded=g.loadGame(storage);
  assert.equal(loaded.players[1].skipNextRefill,true);
  loaded.currentPlayerIndex=1; loaded.phase='turnStart';
  assert.equal(g.beginTurn(loaded).skipped,true);
  loaded.currentPlayerIndex=1; loaded.players[1].hand=[];
  assert.equal(g.beginTurn(loaded).cards.length,3);
});
test('invalid self target never consumes a special card', () => {
  const s=setup('fire');
  assert.equal(g.playTacticCard(s,'human','special','human').ok,false);
  assert.equal(s.players[0].hand.length,1);
});
test('AI executes fire as fire and exposes the burned card to its animation hook', async () => {
  const s=setup('fire',1);
  s.players[0].treasures={goldSeal:1,sword:1,gun:1,pomelo:0};
  const count=s.players[0].hand.length;
  let result;
  await g.runAiTurn(s,'ai1',{afterAction:async (_d,_s,r)=>{result=r;}});
  assert.equal(s.players[0].hand.length,count-1);
  assert.equal(s.players[0].skipTurns,0);
  assert.match(result.activation,/AI玩家甲 →【火烧百顺楼】→ 玩家（你）/);
  assert.ok(result.message.includes(result.burnedCard.name));
});
