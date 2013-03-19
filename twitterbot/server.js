
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

// twitterライブラリをロード
var twitter = require('twitter');

var bot = new twitter({
  consumer_key        : '***** your consumer key here *****',
  consumer_secret     : '***** your consumer secret key here *****',
  access_token_key    : '***** your access token key here *****',
  access_token_secret : '***** your access token secret key here *****'
});

// dotcloudでスリープされないよう、1日に1度はつぶやく
setInterval(function() {
  // syamojigzagの総発言回数を取得
  bot.get('/statuses/show/311850578403786752.json', {include_entities:true},function(data) {
    var todayDate = new Date();
    bot.updateStatus(todayDate.getMonth()+'月'+todayDate.getDay()+'日までのつぶやき→'+data.user.statuses_count+'回');
  });
}, 1000*60*60*24);


bot.stream('user', function(stream) {
  // userstreamでdataがきたら
  stream.on('data', function(data) {
    // おみくじ配列
    var omikuji = ["大吉", "中吉", "吉", "末吉", "小吉", "凶", "大凶"];
    var omikujiResult = "";

    // 発言してきた人のIDを取得
    var id = ('user' in data && 'screen_name' in data.user) ? data.user.screen_name : null;
    // おみくじの文言を格納
    var text = omikuji[Math.floor(Math.random() * 6)];
    // おなじおみくじは連続で出さない
    while (omikujiResult == text)
      text = omikuji[Math.floor(Math.random() * 6)];
    omikujiResult = text;
    // リプライから会話を辿れるようにする
    in_reply_to_status_id = data.id_str;

    // フォローされた、などでもuserstreamが飛んでくるため、
    // 発言のみに反応
    var tsubuyaki = data.text;

    // 発言でかつリプライになっているか
    if (typeof(tsubuyaki) == "string" ? tsubuyaki.match(/^@syamojigzag\s/i) : 0) {
      var msg = '@' + id + ' はい、' + text;
      msg += '。ラッキーナンバーは'+(Math.floor(Math.random()*100)+1);
      // update
      // 本当は、ここで403（重複発言）などのチェックもすべき
      bot.updateStatus(msg, {in_reply_to_status_id: data.id_str}, function (data) {
      });
    }
  });
});

// expressのひな形
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
