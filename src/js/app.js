App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        //petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
    
    if(typeof web3 !== 'undefined'){
      App.web3Provider = web3.currentProvider;
    }
    else{
      App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
    }

    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {

    $.getJSON('Adoption.json', function (data) {
      // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted(); //进行回调,所以先执行这个
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function(adopters, account) {
    var adoptionInstance;
    App.contracts.Adoption.deployed().then(function(instance) {
    adoptionInstance = instance;
    // 这里部署了合约, 并且保存该合约的实例
    // 调用合约的getAdopters(), 用call读取信息不用消耗gas, 返回领养者的array
    return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      // 得到领养者列表之后, 这里进行遍历, 如果发现有存在合理的领养者(if), 改变前端的按钮样式吧(应该)
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Sold').attr('disabled', true);
       }
      }
    }).catch(function(err) {
    console.log(err.message);
      //这里捕获异常, 并且log出来
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    // 获取用户账号.调用Web3
    web3.eth.getAccounts(function(error, accounts) {
      // 出常的回调
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
    // 创建合约实例       
      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // 发送交易领养宠物
        return adoptionInstance.adopt(petId, {from: account});  //执行领养函数
      }).then(function(result) {
        return App.markAdopted();   // 标记所领养宠物
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
