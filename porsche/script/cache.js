/*!
 * Offline Cache Library v1.0.0
 *
 * Copyright (c) 2013 Tencent
 *
 * Date: 2013-05-21 17:42:16  (Wed, 21 May 2013)
 * Revision: 01
 */


/*
* 接口使用说明：
 1.cache.setItem(key, value, suc, err)
 key: string类型
 value: string类型
 suc：设置成功的回调函数
 err：设置失败的回调函数
 设置（key， value）值对

 2.cache.getItem(key, suc, err)
 key: string类型
 suc：获取成功的回调函数
 err：获取失败的回调函数
 获取健key的值

 3.cache.removeItem(key, suc, err)
 key: string类型
 suc：删除成功的回调函数
 err：删除失败的回调函数
 删除键为key的（key， value）值对

 4.cache.clear(suc, err)
 suc：清除所有记录成功的回调函数
 err：清除所有记录失败的回调函数
 清除所有的记录
* */

 ;(
   function(w){
      var cacheErr = {
           code:{
               WEBSQL_ERR: 1,
               INDEXDB_ERR: 2,
               FILESYSTEM_ERR:3,
               LOCALSTORAGE_ERR:4,
               OUT_OF_MEMERY:5,
               NO_RESULT: 6,
               UNKNOWN:7
           },
           msg:{
               WEBSQL_ERR: "WebSQL error",
               INDEXDB_ERR: "IndexDB error",
               FILESYSTEM_ERR: "Filesystem error",
               LOCALSTORAGE_ERR:"Localstorage error",
               OUT_OF_MEMERY: "Out of memmory",
               NO_RESULT: "No result",
               UNKNOWN: "Unknow error"
           }
       };

       var GLOBAL_CONST = {
           FILESYSTEM_NUM: 10, // fileSystem中文件的个数
           FILESYSTEM_SIZE: 50*1024*1024, // fileSystem默认申请的存储空间
           WEBSQL_SIZE: 30*1024*1024 // webSQL默认申请的存储空间
       };

       var server = (location.host).replace(/\//g, "_"); // 用于处理同域不同路径的情况

       var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
       var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
       var Indexeddb =  window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

       var cacheMgr = {
           webSQL: {
                        inited: false,
                        defaultDBName: server + "_webSQL_db", // 默认的db名字
                        defaultTableName: "webSQL_table" // 默认的table名字
                    },
           fileSystem: {
                            inited: false,
                            defaultFileName: server + "_fileSystem_file", // 默认的文件名前缀
                            num: GLOBAL_CONST.FILESYSTEM_NUM, // 文件数目常量
                            cache: {},
                            cacheBackup: {} // 用于备份缓存中的数据，防止数据丢失
                        },
           indexedDB: {
                           inited: false,
                           oldVersion: false, // 用于标识是否为旧的规范
                           indexedDB: Indexeddb,
                           IDBTransaction: window.IDBTransaction || window.webkitIDBTransaction,
                           IDBKeyRange: window.IDBKeyRange || window.webkitIDBKeyRange,
                           defaultDBName: server + "_indexedDB_db",
                           defaultTableName : "indexedDB_table"
                        },
           supportWebSQL: !!(window.openDatabase), // 初步判断是否支持webSQL
           supportFileSystem: !!requestFileSystem, // 初步判断是否支持fileSystem
           supportIndexedDB: !!Indexeddb, // 初步判断是否支持indexedDB
           localStorage: {}
       };

       // 深度拷贝对象
       function clone(obj){
           if(typeof(obj) != 'object')
               return obj;
           if(obj == null)
               return obj;
           var o = new Object();
           for(var i in obj)
               o[i] = clone(obj[i]);
           return o;
       }

       cacheMgr.webSQL.init = function(suc, err){
           var t = cacheMgr.webSQL;
           t.dbName = t.defaultDBName;
           t.version = "1.0";
           t.displayName = t.defaultDBName;
           t.size = GLOBAL_CONST.WEBSQL_SIZE;
           var db;
           try
           {
               db = openDatabase(t.dbName, t.version, t.displayName, t.size);
               if(!db)
               {
                   // 进一步判读是否支持webSQL
                   cacheMgr.supportWebSQL = false;
                   cacheMgr.webSQL.inited = false;
                   err && err();
               }
               else
               {
                   // 创建table
                   cacheMgr.supportWebSQL = true;
                   setTimeout(function(){
                       t.createTable(t.defaultTableName);
                       cacheMgr.webSQL.inited = true;
                       suc && suc();
                   }, 17);
               }
           }
           catch(e)
           {
               db = undefined;
               cacheMgr.supportWebSQL = false;
               cacheMgr.webSQL.inited = false;
               err && err();
           }
           cacheMgr.webSQL.db = db;
       };

       // 创建table
       cacheMgr.webSQL.createTable = function(tableName, callback){
           tableName = "table_" + tableName;
           var sql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' ([key] TEXT  NOT NULL UNIQUE,[value] TEXT  NOT NULL)';
           cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(function(transaction) {
               transaction.executeSql(sql, [], function(){
                   callback && callback();
               }, function(){});
           });
       };

       // 将数据插入到指定的table中
       cacheMgr.webSQL.insertData = function(tableName, data, suc, err){
           var t = cacheMgr.webSQL;
           tableName = "table_" + tableName;
           // 插入数据的格式为key-value对
           var sql = 'INSERT OR REPLACE INTO ' + tableName + ' VALUES (?, ?)';
           t.db && t.db.transaction(function (transaction){
               transaction.executeSql(sql, data, function(){
                   suc && suc();
               }, function(){
                   err && err({code:cacheErr.code.WEBSQL_ERR, msg: cacheErr.msg.WEBSQL_ERR});
               });
           },function(){
               err && err({code:cacheErr.code.WEBSQL_ERR, msg: cacheErr.msg.WEBSQL_ERR});
           });
       };

       // 查询数据
       cacheMgr.webSQL.selectData = function(sql, suc, err, isResultList){
           cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(
               function (transaction) {
                   transaction.executeSql(sql, [], function(ts, results) {
                           if(results.rows.length > 0)
                           {
                              // 获取查询结果
                               if(!isResultList){
                                   var v = results.rows.item(0);
                                   //console.log("result " +  v.value);
                                   suc && suc(v.value);
                               }
                               else
                               {
                                   var obj = {};
                                   var resultArr = results.rows;
                                   var len = resultArr.length;
                                   for(var i = 0; i < len; i++)
                                   {
                                       var temp = resultArr.item(i);
                                       obj[temp.key] = temp.value;
                                   }
                                   suc && suc(obj);
                               }
                           }
                           else
                           {
                               // 如果result为空数组，则表示没有搜索结果
                               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
                           }
                       },
                       function(ts, e){
                           //console.log("Fail to select");
                           err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
                       });
               }
           );
       };

       // 删除table
       cacheMgr.webSQL.dropTables = function(tableName, suc ,err){
           tableName = "table_" + tableName;
           var sql =  "DROP TABLE " + tableName + ";";
           cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(
               function (transaction) {
                   transaction.executeSql(sql, [],
                       function(){
                           suc && suc();
                       },
                       function(){
                           //console.log("Fail to drop!");
                           err && err({code:cacheErr.code.WEBSQL_ERR, msg: cacheErr.msg.WEBSQL_ERR});
                       });
               }
           );
       };

       cacheMgr.webSQL.drop = function(name, suc, err){
           !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
           cacheMgr.webSQL.dropTables(name, suc, err);
       };

       cacheMgr.webSQL.getItem = function(key, suc, err){
           var t = cacheMgr.webSQL;
           // 没有初始化，需要初始化
           if(!t.inited)
           {
               t.init();
               t.createTable(t.defaultTableName);
           }
           var table = "table_" + t.defaultTableName;
           var sql = "SELECT * FROM " +  table + ' where key="' + key + '"';
           try
           {
               // 查询数据
               t.selectData(sql, suc, err);
           }
           catch(e)
           {
               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
           }
       };

       cacheMgr.webSQL.setItem = function(key, value, suc, err){
           var t = cacheMgr.webSQL;
           // 没有初始化，需要初始化
           if(!t.inited)
           {
               t.init();
               t.createTable(t.defaultTableName);
           }
           var data = [];
           data[0] = key + "";
           data[1] = value + "";
           // 设置数据
           t.insertData(t.defaultTableName, data, suc, err);

       };

       cacheMgr.webSQL.getAll = function(suc, err){
           var t = cacheMgr.webSQL;
           // 没有初始化，需要初始化
           if(!t.inited)
           {
               t.init();
               t.createTable(t.defaultTableName);
           }
           var table = "table_" + t.defaultTableName;
           var sql = "SELECT * FROM " +  table;
           try
           {
               // 查询数据
               t.selectData(sql, suc, err, true);
           }
           catch(e)
           {
               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
           }
       };

       cacheMgr.webSQL.removeItem = function(key, suc, err){
           var t = cacheMgr.webSQL;
           // 没有初始化，需要初始化
           if(!t.inited)
           {
               t.init();
               t.createTable(t.defaultTableName);
           }
           var table = "table_" + t.defaultTableName;
           // 删除指定的数据
           var sql = "DELETE FROM " +  table + ' WHERE key="' + key + '"';
           cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(
               function (transaction) {
                   transaction.executeSql(sql, [],
                       function(){
                           //console.log("Success to remove " + key);
                           suc && suc();
                       },
                       function(){
                           //console.log("Fail to remove " + key);
                           err && err({code:cacheErr.code.WEBSQL_ERR, msg: cacheErr.msg.WEBSQL_ERR});
                       });
               }
           );
       };

       cacheMgr.webSQL.clear = function(suc, err){
           var t = cacheMgr.webSQL;
           // 没有初始化，需要初始化
           if(!t.inited)
           {
               t.init();
               t.createTable(t.defaultTableName);
           }
           // 清除数据采取删除table的方式
           t.drop(t.defaultTableName, function(){
               t.inited = undefined;
               suc && suc();
           }, function(){
               t.inited = undefined;
               err && err({code:cacheErr.code.WEBSQL_ERR, msg: cacheErr.msg.WEBSQL_ERR});
           });
       };

       cacheMgr.fileSystem.init = function(suc, err){
           // 实际测试发现，这个参数对实际用到的存储空间没有影响
           var size = GLOBAL_CONST.FILESYSTEM_SIZE;
           var t = cacheMgr.fileSystem;
           cacheMgr.supportFileSystem = false;
           // 如果不支持JSON,则该库对于filesystem不可用,即标识为不支持
           if(!window.JSON)
           {
               cacheMgr.supportFileSystem = false;
               err && err();
               return;
           }
           try
           {
               // 使用临时空间存储文件
               requestFileSystem(TEMPORARY, size, function(fs) {
                   t.fs = fs;
                   cacheMgr.supportFileSystem = true;
                   // 检测文件是否存在
                   t.check(function(){
                       //console.log("Success to check");
                       // 读取文件中数据
                       t.fetchAll(function(){
                           t.inited = true;
                           suc && suc();
                       }, err);
                   }, function(){
                       //console.log("Fail to check");
                       // 生成相应的文件
                       t.generate(function(){
                           // 读取文件中的数据
                           t.fetchAll(function(){
                               t.inited = true;
                               suc && suc();
                           }, err);
                       }, err);
                   });
               }, function(e) {
                   err && err();
               });
           }
           catch(e)
           {
               err && err();
           }
       };

       cacheMgr.fileSystem.fetchAll = function(suc, err){
           var t = cacheMgr.fileSystem;
           var name;
           var sucNum = 0, isErr = false, runErr = false;
           //读取所有的文件的数据，写入到缓存中
           for(var i = 0; i < t.num && !isErr; i++)
           {
               name = t.defaultFileName + i;
               // 读取指定文件中的数据
               t.fetch(name, function() {
                   sucNum ++;
                   // 只有读取完所有的文件才调用suc
                   if(sucNum === t.num)
                       suc && suc();
               },function(){
                   isErr = true;
                   if(!runErr) // 只执行一次err（）
                   {
                       runErr = true;
                       err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
                   }
               });
           }
       };

       // 读取指定文件中的数据
       cacheMgr.fileSystem.fetch = function(name, suc, err){
           var t = cacheMgr.fileSystem;
           t.fs.root.getFile(name, {create:false}, function(fileEntry) {
               fileEntry.file(function(f) {
                   var fr = new FileReader();
                   fr.onloadend  = function(e) {
                       if(this.result)
                       {
                           try
                           {
                               // 解析文件
                               t.cache[name] = JSON.parse(this.result);
                               // 备份数据
                               t.cacheBackup[name] = clone(t.cache[name]);
                               //console.log("json.parse: " + name);
                           }
                           catch(e)
                           {
                               //console.log("json.parse abort: " + name);
                               // 清空文件
                               t.cache[name] = {};
                               t.cacheBackup[name] = {};
                               t.flush(name, suc, err);
                           }
                       }
                       else
                       {
                           // 空文件，没有数据
                           t.cache[name] = {};
                           t.cacheBackup[name] = {};
                       }
                       suc && suc();
                   };
                   fr.readAsText(f);
               });
           }, function() {
               //console.log("getFile error: " + name);
               err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
           });
       };

       cacheMgr.fileSystem.get = function(key, suc, err){
           var t = cacheMgr.fileSystem;
           var name = t.hash(key);
           //console.log("key: " + key + ", name: " + name);
           // 直接从缓存中读取数据
           if(key in t.cache[name])
               suc && suc(t.cache[name][key]);
           else
               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
       };

       // 创建文件
       cacheMgr.fileSystem.generate = function(suc, err){
           var t = cacheMgr.fileSystem;
           var name;
           var sucNum = 0, isErr = false, runErr = false;
           for(var i = 0; i < t.num && !isErr; i++)
           {
               name = t.defaultFileName + i;
               t.fs.root.getFile(name, {create: true}, function(fileEntry) {
                   sucNum ++;
                   // 创建完所有的文件后才调用suc
                   if(sucNum === t.num)
                       suc && suc();
               },function(){
                   isErr = true;
                   // 只执行一次err
                   if(!runErr)
                   {
                       runErr = true;
                       err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
                   }
               });
           }
       };

       // 检测文件是否存在
       cacheMgr.fileSystem.check = function(suc, err){
           var t = cacheMgr.fileSystem;
           // 检测策略：只检测最后一个文件是否存在
           var i = t.num - 1;
           var name = t.defaultFileName + i;
           t.fs.root.getFile(name, {create:false}, function(fileEntry) {
               suc && suc();
           }, function(e) {
               err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
           });
       };

       // 将数据写入到指定的文件中
       cacheMgr.fileSystem.flush = function(name, suc, err){
           var t = cacheMgr.fileSystem;
           // 写入策略: 先清空文件再写入文件，如果空间已满，则将备份中的文件写入。
           t.fs.root.getFile(name, {create:false}, function(fileEntry) {
               fileEntry.createWriter(function(writer) {
                   writer.onwriteend = function() {
                       fileEntry.createWriter(function(write){
                           write.onwriteend = function() {
                               t.cacheBackup[name] = clone(t.cache[name]);
                               suc && suc();
                           };
                           write.onerror = function(e){
                               //console.log("write error: " + name);
                               t.cache[name] = clone(t.cacheBackup[name]);
                               t.flush(name, suc, err);
                           };

                           var bb = undefined;
                           // 兼容处理：chrome 24后采用Blob方式
                           if(!BlobBuilder)
                           {
                               bb = new Blob([JSON.stringify(t.cache[name])], {type: "text/plain"});
                               write.write(bb);
                           }
                           else
                           {
                               bb = new BlobBuilder();
                               bb.append(JSON.stringify(t.cache[name]));
                               write.write(bb.getBlob('text/plain'));
                           }

                       },function(){
                           //console.log("fileEntry.createWriter error : " + name);
                           err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
                       });
                   };
                   // 清空文件
                   writer.truncate(0);
               },function(){
                   err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
               });
           }, function(e){
               // 文件不存在
               if(e.code === 1)
               {
                   t.generate(function(){
                       t.flush(name, suc, err);
                   }, err);
               }
               else
                   err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
           });
       };

       // hash算法 将key映射到文件名
       cacheMgr.fileSystem.hash = function(key){
           var t = cacheMgr.fileSystem;
           key = key + "";
           var len = key.length;
           var sum = 0;
           var name;
           if(len > 0)
           {
               for(var i = 0; i < len; i++)
               {
                   sum += key.charCodeAt(i);
               }
           }
           name = t.defaultFileName + (sum % t.num);
           return name;
       };

       cacheMgr.fileSystem.getItem = function(key, suc, err){
           var t = cacheMgr.fileSystem;
           var name = t.hash(key);
           key += "";
           // 如果缓存中有数据，直接从缓存中取；如果没有就从文件读取。
           if(t.cache[name] != undefined && t.cache[name] != null && t.cache[name] != "")
           {
               t.get(key, suc, err);
           }
           else
           {
               // 先将数据从文件中读取到缓存中，然后再从缓存中取数据
               t.fetchAll(function(){
                   t.get(key, suc, err);
               }, function(){
                   err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
               });
           }
       };

       cacheMgr.fileSystem.getAll = function(suc, err){
           var t = cacheMgr.fileSystem;
           var obj = {};

           function clone(){
               var keys1 = Object.keys(t.cache);
               var len1 = keys1.length;
               for(var i = 0; i < len1; i++)
               {
                   var tempObj = t.cache[keys1[i]];
                   var keys2 = Object.keys(tempObj);
                   var len2 = keys2.length;
                   for(var j = 0; j < len2; j++)
                   {
                       obj[keys2[j]] = tempObj[keys2[j]];
                   }
               }
           }

           if(Object.keys(t.cache).length == 0)
           {
               t.fetchAll(function(){
                    clone();
                    suc && suc(obj);
               }, function(){
                   err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
               });
           }
           else
           {
               clone();
               suc && suc(obj);
           }
       };

       cacheMgr.fileSystem.setItem = function(key, value,suc, err){
           key += "";
           var t = cacheMgr.fileSystem;
           var name = t.hash(key);
           // 数据写入到缓存中，然后将缓存中的数据flush到文件中
           t.cache[name][key] = value + "";
           t.flush(name, suc, err);
       };

       cacheMgr.fileSystem.removeItem = function(key, suc, err){
           var t = cacheMgr.fileSystem;
           var name = t.hash(key);
           // 删除数据，然后将缓存中的数据flush到文件中。
           delete t.cache[name][key];
           t.flush(name, suc, err);
       };

       cacheMgr.fileSystem.clear = function(suc, err){
           var t = cacheMgr.fileSystem;
           // 清空缓存
           t.cache = {};
           var name;
           var sucNum = 0, isErr = false, runErr = false;
           // 将文件中数据清空
           for(var i = 0; i < t.num && !isErr; i++)
           {
               name = t.defaultFileName + i;
               t.cache[name] = {};
               t.flush(name, function() {
                   sucNum ++;
                   // 将所有文件flush成功后才调用suc
                   if(sucNum === t.num)
                       suc && suc();
               },function(){
                   isErr = true;
                   // 只执行一次err()
                   if(!runErr)
                   {
                       runErr = true;
                       err && err({code:cacheErr.code.FILESYSTEM_ERR, msg: cacheErr.msg.FILESYSTEM_ERR});
                   }
               });
           }
       };

       cacheMgr.indexedDB.init = function(suc, err){
           var iDB = cacheMgr.indexedDB;

           // 不支持indexedDB
           if(!iDB.indexedDB)
           {
               cacheMgr.supportIndexedDB = false;
               err && err();
               return;
           }
           if(iDB.db != undefined && iDB.db != null)
           {
               cacheMgr.supportIndexedDB = true;
               suc && suc();
               return;
           }
           var request = iDB.indexedDB.open(iDB.defaultDBName, 1);

           // 用于判断open是否为新的规范，新的规范中没有setVersion接口
           if("onupgradeneeded" in request)
               iDB.oldVersion = false;
           else
               iDB.oldVersion = true;

           if(iDB.oldVersion)
           {
               //console.log("old version");
               request.onsuccess = function(e) {
                   cacheMgr.supportIndexedDB = true;
                   iDB.db = e.target.result;
                   if (iDB.db.version != "1.0")
                   {
                       var requestVersion = iDB.db.setVersion("1.0");
                       requestVersion.onerror = function(event) {
                           //console.log("Fail to set version 1.0!");
                           err && err();
                       };
                       requestVersion.onsuccess = function(event) {
                           //console.log("Success to set version 1.0!");
                           // 创建table
                           var objectStore = iDB.db.createObjectStore(iDB.defaultTableName, {
                               keyPath: "key",
                               autoIncrement: false
                           });

                           objectStore.createIndex("value", "value", { unique: false });
                       };
                       requestVersion.onblocked = function(event){
                           //console.log("block to set version 1.0");
                       };
                   }
                   cacheMgr.indexedDB.inited = true;
               };
               request.onerror = function(e){
                   cacheMgr.supportIndexedDB = false;
                   cacheMgr.indexedDB.inited = false;
                   err && err();
               };
           }
           else
           {
               //console.log("new version");
               request.onupgradeneeded = function(e) {
                   //console.log("open onupgradeneeded");
                   iDB.db = e.currentTarget.result;
                   // 创建table
                   var objectStore = iDB.db.createObjectStore(iDB.defaultTableName, {
                       keyPath: "key",
                       autoIncrement: false
                   });
                   objectStore.createIndex("value", "value", { unique: false });
               };

               request.onsuccess = function(e) {
                   //console.log("open success");
                   iDB.db = e.currentTarget.result;
                   cacheMgr.indexedDB.inited = true;
                   suc && suc();
               };

               request.onerror = function(e){
                   cacheMgr.supportIndexedDB = false;
                   cacheMgr.indexedDB.inited = false;
                   err && err();
               };
           }
       };

       cacheMgr.indexedDB.setItem = function(key, value, suc, err){
           if(!cacheMgr.indexedDB.inited)
           {
               err && err({code:cacheErr.code.INDEXDB_ERR, msg: cacheErr.msg.INDEXDB_ERR});
               return;
           }
           var db = cacheMgr.indexedDB.db;
           var trans;
           var table = cacheMgr.indexedDB.defaultTableName;

           // 兼容indexedDB的新旧规范
           if(cacheMgr.indexedDB.IDBTransaction.READ_WRITE)
               trans = db.transaction([table], cacheMgr.indexedDB.IDBTransaction.READ_WRITE);
           else
               trans = db.transaction(table, "readwrite");
           var store = trans.objectStore(table);
           var data = {};
           data.key = key + "";
           data.value = value + "";

           // 写入数据
           var request = store.put(data);
           request.onsuccess = function(e) {
               ////console.log("Success to setItem!");
               suc && suc();
           };

           request.onerror = function(e) {
               //console.log("Fail to setItem(error)!");
               err && err({code:cacheErr.code.INDEXDB_ERR, msg: cacheErr.msg.INDEXDB_ERR});
           };

           request.onblocked = function(e){
               //console.log("Fail to setItem!(blocked)");
               err && err({code:cacheErr.code.INDEXDB_ERR, msg: cacheErr.msg.INDEXDB_ERR});
           };
       };

       cacheMgr.indexedDB.getItem = function(key, suc, err){
           if(!cacheMgr.indexedDB.inited)
           {
               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
               return;
           }
           key += "";
           var iDB = cacheMgr.indexedDB;
           var name = iDB.defaultTableName;
           var trans = iDB.db.transaction(name);
           var store = trans.objectStore(name);
           var valueRequest = store.get(key);
           valueRequest.onsuccess = function(e){
               if(e.target.result == null || e.target.result == undefined)
               {
                   //console.log("Fail to get value");
                   err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
                   return;
               }
               var value = e.target.result.value;
               suc && suc(value);
           };
           valueRequest.error = function(e){
               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
           };
       };

       cacheMgr.indexedDB.removeItem = function(key, suc, err){
           if(!cacheMgr.indexedDB.inited)
           {
               err && err({code:cacheErr.code.INDEXDB_ERR, msg: cacheErr.msg.INDEXDB_ERR});
               return;
           }
           key += "";
           var iDB = cacheMgr.indexedDB;
           var trans;
           var name = iDB.defaultTableName;
           // 兼容indexedDB的新旧规范
           if(iDB.IDBTransaction.READ_WRITE)
               trans = iDB.db.transaction(name, iDB.IDBTransaction.READ_WRITE);
           else
               trans = iDB.db.transaction(name, "readwrite");
           var store = trans.objectStore(name);
           var removeReq = store["delete"](key);
           removeReq.onsuccess = function(e){
               //console.log("Success to remove " + key);
               suc && suc();
           };
           removeReq.onerror = function(e){
               //console.log("Fail to remove " + key);
               err && err({code:cacheErr.code.INDEXDB_ERR, msg: cacheErr.msg.INDEXDB_ERR});
           };
       };

       cacheMgr.indexedDB.getAll = function(suc, err){
           if(!cacheMgr.indexedDB.inited)
           {
               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
               return;
           }
           var iDB = cacheMgr.indexedDB;
           var name = iDB.defaultTableName;
           var trans = iDB.db.transaction(name);
           var store = trans.objectStore(name);
           var request = store.openCursor();
           var obj = {};
           request.onsuccess = function(e){
               var cursor = e.target.result;
               if(cursor)
               {
                   obj[cursor.key] = cursor.value.value;
                   cursor["continue"]();
               }
               else
               {
                   suc && suc(obj);
               }
           };
           request.onerror = function(e){
               err && err();
           }
       };

       cacheMgr.indexedDB.clear = function(suc, err){
           if(!cacheMgr.indexedDB.inited)
           {
               err && err({code:cacheErr.code.INDEXDB_ERR, msg: cacheErr.msg.INDEXDB_ERR});
               return;
           }
           var iDB = cacheMgr.indexedDB;
           var name = iDB.defaultTableName;
           var trans;

           // 兼容indexedDB的新旧规范
           if(iDB.IDBTransaction.READ_WRITE)
               trans = iDB.db.transaction(name, iDB.IDBTransaction.READ_WRITE);
           else
               trans = iDB.db.transaction(name, "readwrite");

           // 清空store中的数据
           var store = trans.objectStore(name);
           var clearReq = store.clear();
           clearReq.onsuccess = function(e){
               //console.log("Success to clear!");
               suc && suc();
           };
           clearReq.onerror = function(e){
               //console.log("Fail to clear!");
               err && err({code:cacheErr.code.INDEXDB_ERR, msg: cacheErr.msg.INDEXDB_ERR});
           };
       };

       cacheMgr.localStorage.setItem = function(key, value, suc, err){
           try
           {
               localStorage.setItem(key,value);
               suc && suc();
           }
           catch(e)
           {
               err && err({code:cacheErr.code.LOCALSTORAGE_ERR, msg: cacheErr.msg.LOCALSTORAGE_ERR});
           }

       };

       cacheMgr.localStorage.getItem = function(key, suc, err){
           try
           {
               var value = localStorage.getItem(key);
               suc && suc(value);
           }
           catch(e)
           {
               err && err({code:cacheErr.code.NO_RESULT, msg: cacheErr.msg.NO_RESULT});
           }
       };

       cacheMgr.localStorage.getAll = function(suc){
           var obj = {};
           var len = localStorage.length;
           for(var i = 0; i < len; i++)
           {
               var keys = localStorage.key(i);
               obj[keys] = localStorage.getItem(keys);
           }
           suc && suc(obj);
       };

       cacheMgr.localStorage.removeItem = function(key, suc, err){
           try
           {
               var value = localStorage.removeItem(key);
               suc && suc(value);
           }
           catch(e)
           {
               err && err({code:cacheErr.code.LOCALSTORAGE_ERR, msg: cacheErr.msg.LOCALSTORAGE_ERR});
           }
       };

       cacheMgr.localStorage.clear = function(suc, err){
           try
           {
               var value = localStorage.clear();
               suc && suc(value);
           }
           catch(e)
           {
               err && err({code:cacheErr.code.LOCALSTORAGE_ERR, msg: cacheErr.msg.LOCALSTORAGE_ERR});
           }
       };

       cacheMgr.inited = false;
       w.cache = {};

       // 离线方式的优先级为：webSQL > fileSystem > indexedDB > localstorage
       cacheMgr.init = function(suc){
           cacheMgr.webSQL.init(function(){
               var t = cacheMgr.webSQL;
               cacheMgr.set = t.setItem;
               cacheMgr.get = t.getItem;
               cacheMgr.remove = t.removeItem;
               cacheMgr.clearItem = t.clear;
               cacheMgr.getAll = t.getAll;
               cacheMgr.inited = true;
               suc && suc();
           }, function(){
               cacheMgr.fileSystem.init(function(){
                   var t = cacheMgr.fileSystem;
                   cacheMgr.set = t.setItem;
                   cacheMgr.get = t.getItem;
                   cacheMgr.remove = t.removeItem;
                   cacheMgr.clearItem = t.clear;
                   cacheMgr.inited = true;
                   cacheMgr.getAll = t.getAll;
                   suc && suc();
               }, function(){
                   cacheMgr.indexedDB.init(function(){
                       var  t = cacheMgr.indexedDB;
                       cacheMgr.set = t.setItem;
                       cacheMgr.get = t.getItem;
                       cacheMgr.remove = t.removeItem;
                       cacheMgr.clearItem = t.clear;
                       cacheMgr.inited = true;
                       cacheMgr.getAll = t.getAll;
                       suc && suc();
                   }, function(){
                       var  t = cacheMgr.localStorage;
                       cacheMgr.set = t.setItem;
                       cacheMgr.get = t.getItem;
                       cacheMgr.remove = t.removeItem;
                       cacheMgr.clearItem = t.clear;
                       cacheMgr.inited = true;
                       cacheMgr.getAll = t.getAll;
                       suc && suc();
                   });
               });
           });
       };

       // 对外只提供4个接口：setItem, getItem, removeItem和clear
       w.cache.setItem = function(key, value, suc, err){
           if(cacheMgr.inited)
               cacheMgr.set(key, value, suc, err);
           else
               cacheMgr.init(function(){cacheMgr.set(key, value, suc, err);});
       };

       w.cache.getItem = function(key, suc, err){
           if(cacheMgr.inited)
               cacheMgr.get(key, suc, err);
           else
               cacheMgr.init(function(){cacheMgr.get(key, suc, err);});
       };

       w.cache.removeItem = function(key, suc, err){
           if(cacheMgr.inited)
               cacheMgr.remove(key, suc, err);
           else
               cacheMgr.init(function(){cacheMgr.remove(key, suc, err);});
       };

       w.cache.clear = function(suc, err){
           if(cacheMgr.inited)
               cacheMgr.clearItem(suc, err);
           else
               cacheMgr.init(function(){cacheMgr.clearItem( suc, err);});
       };


       w.cache.getAll = function(suc, err){
           if(cacheMgr.getAll)
                cacheMgr.getAll(suc,err);
           else
                err && err();
       };

       w.cache.init = function(suc){
           if(!cacheMgr.inited)
               cacheMgr.init(suc);
           else
              suc && suc();
       };

       // 初始化
       cacheMgr.init();
   }
)(window);





