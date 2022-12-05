// npm으로 설치했던 express라이브러리의 Router()함수 사용할 것을 선언
var router = require('express').Router();

function loginconfirm(req, response, next){
    if (req.user){
        next()
    } else {
        response.send('로그인 후 접속하십시오.')
    }
}

router.use(loginconfirm);

router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
 });
 
router.get('/pants', function(요청, 응답){
    응답.send('바지 파는 페이지입니다.');
 }); 

 module.exports = router;