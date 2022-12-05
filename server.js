const { response } = require('express');
const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

// static 파일 적용하기 위한 설정
app.use('/public', express.static('public'));

// delete, put 요청 보내기 위한 method-override 설치
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

// 세션 로그인 기능 구현을 위한 라이브러리 설치
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// 세션 로그인을 위한 미들웨어 설정
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

// 환경변수 설정용 라이브러리
require('dotenv').config()

var db
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL, function(err, client){
    if(err) {return console.log(err)}

    db = client.db('todoapp');
    // db.collection('post').insertOne( { 이름 : 'John', 나이: 20, _id : 100 } , function(err, result){
    //    console.log('저장완료');
    // });

    app.listen(process.env.PORT, function(){
        console.log('listening on 8081');
    });
});


// 누군가가 /pet으로 방문하면 pet 관련된 안내문을 띄워주자
// app.get('/pet', function(req, response){
//     response.send('펫 용품을 쇼핑할 수 있는 페이지입니다.');
// });

// app.get('/beauty', function(req, response){
//     response.send('뷰티 용품을 쇼핑할 수 있는 페이지입니다.');
// });

app.get('/', function(req, response){
    response.render('index.ejs');
});

app.get('/write', function(req, response){
    response.render('write.ejs');
});

// /list 로 GET 요청하면 실제 DB에 저장된 데이터로 예쁘게 꾸며진 HTML 보여줌
app.get('/list', function(req, response){
    // DB에 저장된 post라는 collection 안의 모든 데이터를 꺼내주세요
    db.collection('post').find().toArray(function(err, result){
        // console.log(result);
        response.render('list.ejs', { posts : result });    
    });
});

app.get('/detail/:id', function(req, response){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        if(err) {return console.log(err)};
        response.render('detail.ejs', { data : result });
    })
})

app.get('/edit/:id', function(req, response){
    // /edit/2로 접속하면 2번 게시물의 제목과 날짜를 edit.ejs로 보냄
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        // console.log(result)
        response.render('edit.ejs', { post : result })
    })
})

app.put('/edit', function(req, response){
    db.collection('post').updateOne({_id : parseInt(req.body.id) }, { $set : { 제목: req.body.title , 날짜: req.body.date }}, function(err, result){
        // console.log('수정완료')
        response.redirect('/list')
    })
    
})

app.get('/search', (req, response) => {
    var searchcondition = [
        {
            $search: {
              index: 'titleSearch',
              text: {
                query: req.query.value,
                path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
              }
            }
          },
    ]
    db.collection('post').aggregate(searchcondition).toArray((err, result)=>{
        // console.log(req.query.value)
        // console.log(result);
        response.render('searchresult.ejs', { posts : result })
        // response.render('detail.ejs', { data : result })
    })  
});


app.get('/login', function(req, response){
    response.render('login.ejs')  
})

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, response){
    response.redirect('/')
})

app.get('/fail', function(req, response){
    response.render('fail.ejs');
})

app.get('/mypage', loginconfirm, function(req, response){
    // console.log(req.user);
    response.render('mypage.ejs', { 사용자 : req.user })
})

function loginconfirm(req, response, next){
    if (req.user){
        next()
    } else {
        response.send('로그인 후 접속하십시오.')
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  
  passport.deserializeUser(function (userid, done) {
    db.collection('login').findOne({id : userid}, function(err, result){
        done(null, result)
    })
  }); 
  
  app.post('/register', function(req, response){
    db.collection('login').insertOne( { id : req.body.id, pw : req.body.pw }, function(err, result){
        response.redirect('/');
    })
  })

// 어떤 사람이 /add 경로로 POST 요청을 하면 ??를 해주세요

app.post('/add', function(req, response){
    response.send('전송완료');
    db.collection('counter').findOne( { name : '게시물갯수' }, function(err, result){
        console.log(result.totalPost);
        var totalPostCount = result.totalPost;
        var savedinfo = { _id : totalPostCount, 작성자: req.user._id, 제목: req.body.title , 날짜: req.body.date }
        db.collection('post').insertOne(savedinfo, function(err, result){
            console.log('저장완료');
            // counter라는 collection에 있는 totalPost라는 항목도 1 증가시켜야함.
            db.collection('counter').updateOne({name:'게시물갯수'},{ $inc : {totalPost:1}}, function(err, result){
                if(err){return console.log(err)};
            });
        });
    });
    // console.log(req.body.date);
    // console.log(req.body.title);
    
});

app.delete('/delete', function(req, response){
    console.log(req.body);
    req.body._id = parseInt(req.body._id);

    // req.body에 담겨온 게시물 번호를 가진 글을 DB에서 찾아서 삭제
    db.collection('post').deleteOne({ _id : req.body._id, 작성자 : req.user._id }, function(err, result){
        // console.log('삭제완료');
        if (result) {console.log(result)}
        response.status(200).send({ message: '성공했습니다' });
    })
});

app.use('/shop', require('./routes/shop'));

// router.get('/shop/shirts', function(요청, 응답){
//     응답.send('셔츠 파는 페이지입니다.');
//  });
 
// router.get('/shop/pants', function(요청, 응답){
//     응답.send('바지 파는 페이지입니다.');
//  });

app.use('/board/sub', require('./routes/board'));
 
// multer 이용용 라이브러리 설정
let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image')
  },
  filename : function(req, file, cb){
    cb(null, file.originalname )
  }

});

var upload = multer({storage : storage});

app.get('/upload', function(req, response){
    response.render('upload.ejs');
});

app.post('/upload', upload.single('picture'), function(req, response){
    response.send('업로드 완료')
});

app.get('/image/:imageName', function(req, response){
    response.sendFile( __dirname + '/public/image/' + req.params.imageName )
});

