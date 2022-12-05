// npm으로 설치했던 express라이브러리의 Router()함수 사용할 것을 선언
var router = require('express').Router();

router.get('/sports', function(요청, 응답){
    응답.send('스포츠 게시판');
 });
 
 router.get('/game', function(요청, 응답){
    응답.send('게임 게시판');
 }); 

module.exports = router;