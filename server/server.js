// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};



// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

app.models.Role.find({where : {name : 'admin'}} , (err , role) =>{ //created admin role and give it to first user
  if (!err  && role) {
      if(role.length === 0){
          app.models.Role.create({
            name : 'admin'
          }, (err2 , result) => {
              if(!err2 && result){

              app.models.user.findOne((usererr , user) => {
                  if(!usererr && user){
                    result.principals.create({
                      principalType : app.models.RoleMapping.USER,
                      principalId : user.id
                    }, (err3 , principal) => {
                            console.log("Created principal" , err3 , principal)
                    })

                  }
              })
              }
          })
      }
  }
})
app.models.user.afterRemote('create',  (ctx , user , next) => {
  console.log(user , "new user is created");
  app.models.Profile.create({
    first_name : user.first_name,
    email : user.email,
    last_name : user.last_name,
    location : user.location,
    phone : user.phone_number,
    created_at : new Date(),
    userId : user.id,
    role : 'user'
  },(err , result) => {
    if(!err && result){
      console.log("Created new profile" , result)
    }
    else {
      console.log("There is an error" , err)
    }
    next();
  })
});

app.models.RoleMapping.find((err, rm) => {
  if(!err && rm.length === 0){
    app.models.user.findOne({where: {role: "admin"}}, (userErr, user) => {
      if(!userErr && user){
        app.models.Role.findOne({where: {name: 'admin'}}, (roleErr, result) => {
          if(!roleErr && result){
            result.principals.create({
              principalType: app.models.RoleMapping.USER,
              principalId: user.id,
            }, (err3, principal) => {
              console.log('Created principal', err3, principal);
            });
          }
        })
      }
    })
  }
})