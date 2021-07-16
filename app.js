const MAP_WIDTH = 240, MAP_HEIGHT = 320;
const VIEWPORT_WIDTH = 240, VIEWPORT_HEIGHT = 320;
const BOX_DIM = 20;

var READY = false;
var START = false;
var BOX = null;
var COIN = null;
var SCORE = 0;
var HS = 0;
var LIFESPAN = null;
var SCOREBOARD = null;
var HIGHSCORE = null;

const COOR = {
  '80_120': [80, 120],
  '110_120': [110, 120],
  '140_120': [140, 120],
  '80_150': [80, 150],
  '110_150': [110, 150],
  '140_150': [140, 150],
  '80_180': [80, 180],
  '110_180': [110, 180],
  '140_180': [140, 180],
}

function displayKaiAds() {
  var display = true;
  if (window['kaiadstimer'] == null) {
    window['kaiadstimer'] = new Date();
  } else {
    var now = new Date();
    if ((now - window['kaiadstimer']) < 300000) {
      display = false;
    } else {
      window['kaiadstimer'] = now;
    }
  }
  console.log('Display Ads:', display);
  if (!display)
    return;
  getKaiAd({
    publisher: 'ac3140f7-08d6-46d9-aa6f-d861720fba66',
    app: 'bloxx',
    slot: 'kaios',
    onerror: err => console.error(err),
    onready: ad => {
      ad.call('display')
      setTimeout(() => {
        document.body.style.position = '';
      }, 1000);
    }
  })
}

function updateScoreboard(val = 0) {
  var _HS = parseInt(localStorage.getItem('hs')) || 0;
  if (val > _HS) {
    _HS = val
    localStorage.setItem('hs', _HS)
  }
  if (!SCOREBOARD) {
    me.game.world.addChild(new me.Text(10, 295, {font: "Open Sans", size: 15, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `SCORE: `}));
    me.game.world.addChild(new me.Text(100, 295, {font: "Open Sans", size: 15, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `HIGHSCORE: `}));
    HIGHSCORE = me.game.world.addChild(new me.Text(200, 295, {font: "Open Sans", size: 15, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `${HS}`}));
  } else {
    me.game.world.removeChild(SCOREBOARD);
    SCOREBOARD = null;
  }
  SCOREBOARD = me.game.world.addChild(new me.Text(65, 295, {font: "Open Sans", size: 15, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `${val}`}));
  if (_HS > HS) {
    HS = _HS
    me.game.world.removeChild(HIGHSCORE);
    HIGHSCORE = null;
    HIGHSCORE = me.game.world.addChild(new me.Text(195, 295, {font: "Open Sans", size: 15, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `${HS}`}));
  }
}

function getAvailableCoor(exclude) {
  var coors = [];
  for (var i in COOR) {
    if (i != exclude)
      coors.push(COOR[i]);
  }
  const random = Math.floor(Math.random() * coors.length);
  return coors[random];
}

function spawnCoin(x, y) {
  if (LIFESPAN) {
    clearInterval(LIFESPAN);
    LIFESPAN = null;
  }
  COIN = me.game.world.addChild(me.pool.pull("box", x + (BOX_DIM/2)/2, y + (BOX_DIM/2)/2, "#FF0000", BOX_DIM/2, BOX_DIM/2, "COIN"))
  LIFESPAN = setInterval(() => {
    me.game.world.removeChild(COIN)
    const xy = getAvailableCoor(`${BOX.pos.x}_${BOX.pos.y}`);
    COIN = spawnCoin(xy[0], xy[1]);
  }, 3000);
  return COIN;
}

function spawnBlock(dir = []) {
  var x, y;
  const random = dir[Math.floor(Math.random() * 2)];
  if (['top', 'bottom'].indexOf(random) > -1) {
    if (random === 'top')
      y = 0, x = [80, 110,140][Math.floor(Math.random() * 3)];
    else
      y = 320, x = [80, 110,140][Math.floor(Math.random() * 3)];
  } else {
    if (random === 'left')
      x = 0, y = [120, 150,180][Math.floor(Math.random() * 3)];
    else
      x = 240, y = [120, 150,180][Math.floor(Math.random() * 3)];
  }
  me.game.world.moveToTop(me.game.world.addChild(me.pool.pull("box", x, y, "#000", BOX_DIM, BOX_DIM, random)))
}

function newGame() {
  if (START || !READY)
    return
  START = true;
  BOX = me.game.world.addChild(me.pool.pull("box", 80, 180, "#FFF", BOX_DIM, BOX_DIM, "BOX"))
  COIN = spawnCoin(140, 120)
  spawnBlock(['left', 'right'])
  spawnBlock(['top', 'bottom'])
}

var game = {
  resources: [
    { name: "gun", type: "audio", "src": "", },
    { name: "collide", type: "audio", "src": "", },
    { name: "bg-music", type: "audio", "src": "", }
  ],
  loaded: function() {
    me.timer.maxfps = 30;
    me.game.world.fps = 30;
    me.game.world.resize(MAP_WIDTH, MAP_HEIGHT);
    me.pool.register("box", game.Box);
    this.playScreen = new game.PlayScreen();
    me.state.set(me.state.PLAY, this.playScreen);
    me.state.change(me.state.PLAY);
    me.audio.play("bg-music", true, null, 1);
    READY = true
  },
  onload: function () {
    if (!me.video.init(VIEWPORT_WIDTH, VIEWPORT_HEIGHT, {
        parent: document.getElementById('playground'),
        scale: "auto",
        renderer: me.video.CANVAS,
        powerPreference: 'high-performance',
        antiAlias: false
      })) {
      alert("Your browser does not support HTML5 Canvas :(");
      return;
    }
    me.audio.init("mp3");
    me.loader.preload(game.resources, this.loaded.bind(this));
  },
};

game.PlayScreen = me.Stage.extend({
  onResetEvent: function() {
    me.game.world.addChild(new me.ColorLayer("background", "#873eff"), 0);
    me.input.bindKey(me.input.KEY.LEFT, "left");
    me.input.bindKey(me.input.KEY.RIGHT, "right");
    me.input.bindKey(me.input.KEY.UP, "up");
    me.input.bindKey(me.input.KEY.DOWN, "down");
    me.input.bindKey(me.input.KEY.SPACE, "space");
    me.input.bindKey(me.input.KEY.ENTER, "enter");
    me.game.world.addChild(me.pool.pull("box", 70, 115, 'white', 5, 90))
    me.game.world.addChild(me.pool.pull("box", 166, 115, 'white', 5, 90))
    me.game.world.addChild(me.pool.pull("box", 70, 111, 'white', 101, 5))
    me.game.world.addChild(me.pool.pull("box", 70, 205, 'white', 101, 5))
    updateScoreboard(SCORE);
    me.game.world.addChild(new me.Text(10, 22, {font: "Open Sans", size: 12, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `Rules:`}));
    me.game.world.addChild(new me.Text(10, 22 + (12 * 1), {font: "Open Sans", size: 12, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `1) Use the nav-pad to move White box`}));
    me.game.world.addChild(new me.Text(10, 22 + (12 * 2), {font: "Open Sans", size: 12, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `toward the Red box`}));
    me.game.world.addChild(new me.Text(10, 22 + (12 * 3), {font: "Open Sans", size: 12, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `2) If the Red box is not taken in  2 sec,`}));
    me.game.world.addChild(new me.Text(10, 22 + (12 * 4), {font: "Open Sans", size: 12, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `the position will change`}));
    me.game.world.addChild(new me.Text(10, 22 + (12 * 5), {font: "Open Sans", size: 12, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `3) Avoid Black box or your current score`}));
    me.game.world.addChild(new me.Text(10, 22 + (12 * 6), {font: "Open Sans", size: 12, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `will reset to 0 & -1 on next collision`}));
    
    me.game.world.addChild(new me.Text(10, 220, {font: "Open Sans", size: 15, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `Press Enter to Start`}));
    
    me.game.world.addChild(new me.Text(10, 240, {font: "Open Sans", size: 15, fillStyle: "#ffffff", strokeStyle: "#000000", lineWidth: 12, text: `Press End Call to Exit`}));
  },
  onDestroyEvent: function() {
    me.input.unbindKey(me.input.KEY.LEFT);
    me.input.unbindKey(me.input.KEY.RIGHT);
    me.input.unbindKey(me.input.KEY.UP);
    me.input.unbindKey(me.input.KEY.DOWN);
    me.input.unbindKey(me.input.KEY.SPACE);
    me.input.unbindKey(me.input.KEY.ENTER);
  }
});
me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
  if (BOX) {
    switch (keyCode) {
      case 38:
        var n = BOX.pos.y - 30
        BOX.pos.y = n < 120 ? BOX.pos.y : n
        break
      case 40:
        var n = BOX.pos.y + 30
        BOX.pos.y = n > 180 ? BOX.pos.y : n
        break
      case 37:
        var n = BOX.pos.x - 30
        BOX.pos.x = n < 80 ? BOX.pos.x : n
        break
      case 39:
        var n = BOX.pos.x + 30
        BOX.pos.x = n > 140 ? BOX.pos.x : n
        break
    }
  }
});

game.Box = me.Entity.extend({
  init : function (x, y, c = "#FFF", w = BOX_DIM, h = BOX_DIM, type = "BORDER") {
    this._super(me.Entity, "init", [x, y, { width: w, height: h }]);
    this.__TYPE__ = type;
    this.__EXPIRED__ = false;
    this.vel = 85;
    this.body.collisionType = me.collision.types.NO_OBJECT;
    this.renderable = new (me.Renderable.extend({
      init : function () {
        this._super(me.Renderable, "init", [0, 0, w, h]);
      },
      destroy : function () {},
      draw : function (renderer) {
        var color = renderer.getColor();
        renderer.setColor(c);
        renderer.fillRect(0, 0, this.width, this.height);
        renderer.setColor(color);
      }
    }));
    this.alwaysUpdate = true;
  },
  update: function(time) {
    this._super(me.Entity, "update", [time]);
    if (COIN && BOX && this.__TYPE__ === 'BOX') {
      if (this.overlaps(COIN)) {
        me.audio.play("gun", false, null, 1);
        me.game.world.removeChild(COIN)
        COIN = null;
        const xy = getAvailableCoor(`${this.pos.x}_${this.pos.y}`);
        COIN = spawnCoin(xy[0], xy[1]);
        SCORE += 1
        updateScoreboard(SCORE);
      }
    } else if (['top', 'right', 'bottom', 'left'].indexOf(this.__TYPE__) > -1 && !this.__EXPIRED__) {
      var removed = false
      if (this.__TYPE__ === 'top') {
        this.pos.y += (this.vel + 25) * time / 1000;
        if (this.pos.y >= 320) {
          this.__EXPIRED__ = true
          me.game.world.removeChild(this)
          spawnBlock(['top', 'bottom'])
          removed = true
        }
      } else if (this.__TYPE__ === 'right') {
        this.pos.x -= this.vel * time / 1000;
        if (this.pos.x <= 0) {
          this.__EXPIRED__ = true
          me.game.world.removeChild(this)
          spawnBlock(['left', 'right'])
          removed = true
        }
      } else if (this.__TYPE__ === 'bottom') {
        this.pos.y -= (this.vel + 25) * time / 1000;
        if (this.pos.y <= 0) {
          this.__EXPIRED__ = true
          me.game.world.removeChild(this)
          spawnBlock(['top', 'bottom'])
          removed = true
        }
      } else if (this.__TYPE__ === 'left') {
        this.pos.x += this.vel * time / 1000;
        if (this.pos.x >= 240) {
          this.__EXPIRED__ = true
          me.game.world.removeChild(this)
          spawnBlock(['left', 'right'])
          removed = true
        }
      }
      if (!removed) {
        if (this.overlaps(BOX)) {
          this.__EXPIRED__ = true
          me.game.world.removeChild(this)
          if (SCORE <= 0)
            SCORE -= 1
          else
            SCORE = 0
          updateScoreboard(SCORE);
          me.audio.play("collide", false, null, 1);
          if (['left', 'right'].indexOf(this.__TYPE__) > -1)
            spawnBlock(['left', 'right'])
          else
            spawnBlock(['top', 'bottom'])
        }
      }
    }
    return true;
  }
})

window.addEventListener("load", function() {

  displayKaiAds()

  me.device.onReady(() => {
    game.onload();
  });

  if ("ontouchstart" in window) {
    document.addEventListener('keydown', (evt) => {
      me.input.triggerKeyEvent(evt.keyCode, true);
      if ((evt.keyCode === 13)) {
        newGame()
      } else if (evt.key === 'Backspace' || evt.key === 'EndCall') {
        window.close();
      }
    });

    document.addEventListener('keyup', (evt) => {
      me.input.triggerKeyEvent(evt.keyCode, false);
    });
  }

  document.addEventListener('visibilitychange', function(ev) {
    if (document.visibilityState === 'visible') {
      displayKaiAds();
    }
  });

})
