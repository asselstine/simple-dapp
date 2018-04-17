var MyToken;

function updateTotalSupply() {
  MyToken.totalSupply().then(function (data) {
    $('#total-supply').html(data.toString());
  })
}

function mint() {
  MyToken.mint(web3.eth.accounts[0], 1000)
}

$(document).ready(function () {
  $('#mint').on('click', mint)

  $.getJSON('/contracts/MyToken.json').then(function (data) {
    var MyTokenContract = TruffleContract(data)
    MyTokenContract.setProvider(web3.currentProvider)
    MyTokenContract.deployed().then(function (instance) {
      MyToken = instance;
      var Mint = MyToken.Mint()
      Mint.watch(function (error, result) {
        if (error) console.error(error)
        else updateTotalSupply();
      })
      updateTotalSupply();
    })
  })
})
