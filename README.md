# Simple Dapp

This is a tutorial dapp that demonstrates how to mint a custom ERC20 token.  The repository contains the complete app, but you are encouraged to start from scratch using the tutorial below.

# Creating Your First Ethereum Dapp

In this tutorial we're going to build an Ethereum distributed application (dapp).  We're going to build a dapp that mints our own ERC-20 token, shows the user's balance, and allows users to transfer tokens between each other.

We're going to use a number of different technologies:

- The Truffle Framework makes testing and deploying our smart contract code easy
- Infura will allow us to connect to the Ethereum network
- Netlify will allow us to host our application
- MetaMask will manage our Ethereum address

# Setup

Install [Truffle](http://truffleframework.com/):

`npm install -g truffle`

Create the dapp directory and init the truffle project:

```bash
mkdir my-erc20-dapp
cd my-erc20-dapp
truffle init
```

Your dapp directory should now look something like:

```bash
.
..
contracts/
migrations/
test/
truffle.js
truffle-config.js
```

We're going to use pre-made contracts from [OpenZeppelin](https://openzeppelin.org/) to build our dapp.  [zeppelin-solidity](https://github.com/OpenZeppelin/zeppelin-solidity/) is the project that contains the ERC20 code.  Let's init `npm` and install it now:

```bash
npm init
# Now you will be prompted to enter the project details.  Enter whatever you like.
# Once the package.json is setup, install open zeppelin
npm install -E --save zeppelin-solidity
```

# Creating the Contract

Now let's create our token!  Create a new smart contract:

```bash
touch contracts/MyToken.sol
```

We're going to use the MintableToken contract from Zeppelin.  It allows an issuer (us) to mint new tokens and distribute them.

```solidity
// contracts/MyToken.sol

pragma solidity 0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract MyToken is MintableToken {
    string public name = "My Token";
    string public symbol = "MYT";
    uint8 public decimals = 18;
}
```

Let's compile our contracts now to make sure it all works:

```
truffle compile
```

You should see new artifacts in `build/contracts` including `MyToken.json`

# Building the Front End

Let's build out a front-end to interact with this contract.  We're just going to commit the build artifacts and work within the build directory.

Create a new file:

```
touch build/index.html
```

Let's add an interface to the `index.html` file.  For simplicity we're going to download the minimized assets from Github for Truffle and Web3:

```html
<!DOCTYPE html>
<!-- build/index.html -->
<html>
  <head>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.0/css/bulma.min.css' />
  </head>
  <body>

    <section class='hero is-info'>
      <div class='hero-body'>
        <div class='container has-text-centered'>
          <h1 class='title'>
            My Token
          </h1>
          <h2 class='subtitle'>
            An ERC20 test token
          </h2>
        </div>
      </div>
    </section>

    <script type='text/javascript' src='/vendor/web3.min.js'></script>
    <script type='text/javascript' src='/vendor/truffle-contract.min.js'></script>
  </body>
</html>
```

Download the libraries:

```
mkdir build/vendor && cd build/vendor
wget https://raw.githubusercontent.com/ethereum/web3.js/develop/dist/web3.min.js
wget https://raw.githubusercontent.com/trufflesuite/truffle-contract/develop/dist/truffle-contract.min.js
```

Finally let's serve our application.  Install the `serve` npm package:

```
npm install -g serve
```

And serve it on port 5000:

```
serve build
```

If you navigate your browser to http://localhost:5000 you should now see the index.html page.

# Setup Truffle Contract

Let's setup the truffle contract code in the front end.

Remember our generated MyToken.json file from earlier?  The `truffle-contracts` package uses this file to allow JavaScript to interact with the contract.  The JSON file contains the contract ABI and the deployed addresses for each network, among other things.

Let's pull in our old friend jQuery to make life a little easier. In `index.html` before the closing `</body>` tag add:

```html
<script
  src="https://code.jquery.com/jquery-3.3.1.min.js"
  integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
  crossorigin="anonymous"></script>
```

Add an `index.js` script for our own code:

```
touch build/index.js
```

Add this before the closing `</body>` tag in `build/index.html`:

```html
<script type='text/javascript' src='/index.js'></script>
```

Now in `build/index.js` let's setup our JavaScript contract object:

```javascript
$(document).ready(function () {
  $.getJSON('/contracts/MyToken.json').then(function (data) {
    var MyTokenContract = TruffleContract(data)
    console.log('Contract object: ', MyTokenContract)
  })
})
```

Great!  Now we have a JavaScript contract object that understands the contract ABI so that we can conveniently call contract functions.

However, how do we use it?  We've loaded the contract definition, but now we need to to talk to an Ethereum network.

We can set the Ethereum network by setting the Web3 'provider':

```javascript
MyTokenContract.setProvider(new Web3.providers.HttpProvider('http://localhost:9545'))
```

Hmm...but wait.  We don't have an Ethereum node running locally!  So let's start one.

# Deploying to a Local Node

Truffle conveniently provides a `develop` command that starts a local blockchain that initializes a set of accounts with Ether.  Let's use it now.

Open a new terminal and enter:

```
truffle develop
```

You'll see a list of account addresses and the 12 word mnemonic used to generate them at the bottom.

With the Ethereum node running, let's deploy our contract to the network:

```
truffle migrate
```

Error!  It says that no node is running.  Let's update our `truffle.js` so that truffle knows about our local node:

```javascript
// truffle.js

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 9545,
      network_id: "*" // Match any network id
    }
  }
};
```

Let's try again:

```
truffle migrate
```

Now it should say:

```
Using network 'development'.

Network up to date.
```

But we know that our network isn't up-to-date; it's missing the MyToken contract.  This is because we need to create a new Truffle migration; a migration is a JavaScript script that updates contracts on the network.  Let's create a new one:

```bash
truffle create migration create_my_token
```

This should create a new timestamp-named file called something like `migrations/1523919712_create_my_token.js`.

Let's update the file so that it deploys our MyToken contract:

```javascript
// migrations/1523919712_create_my_token.js

var MyToken = artifacts.require('./contracts/MyToken.sol');

module.exports = function(deployer) {
  // Use deployer to state migration tasks.
  deployer.deploy(MyToken);
};
```

Let's re-run our migration:

```
truffle migrate
```

You will now see Truffle deploy the contracts to the network.  A number of addresses will be printed to screen, but the most important ones will be beside the contract names.  These addresses are where the contracts are deployed to the network.  These addresses are also added to the compilation artifacts so that the front-end code can discover the contract location.  You'll notice that the `build/contracts/MyToken.json` file now has a `networks` key with the corresponding address for the development network.

Now that we have a local Ethereum node running and the contract has been deployed, let's go back to `index.js` and try interacting with the contract.

# Connecting to the Local Node

`truffle-contract` supplies a convenient method called `deployed()` that will use the JSON file to create a new contract instance with the correct address.  It uses promises so we'll add a callback that handles the instance.  Let's do it now:

```javascript
// build/index.js
$(document).ready(function () {
  $.getJSON('/contracts/MyToken.json').then(function (data) {
    var MyTokenContract = TruffleContract(data)
    MyTokenContract.setProvider(web3.currentProvider)
    MyTokenContract.deployed().then(function (instance) {
      console.log('Contract instance: ', instance);
    })
  })
})
```

However, upon refreshing you will still see 'Contract has not been deployed to network'.  This is because our front-end doesn't know which network it should be running against; the selected network is configured by the browser extension that is managing the user's wallet.

Install the MetaMask browser extension now, for either Chrome or Firefox.  Once the extension is installed, click on the icon and from the network drop-down in the dialog select 'Custom RPC'.  Enter `http://localhost:9545` as the URL.

Now open MetaMask again and click 'Restore from Seed Phrase'.  Enter the `truffle develop` 12 word mnemonic as the seed phrase.  Use whatever password you like.  You can cut-and-paste the mnemonic from the terminal that `truffle-develop` is running in, or just copy and paste `candy maple cake sugar pudding cream honey rich smooth crumble sweet treat`.  The mnemonic never changes.

MetaMask should now show something like 99 Ether in the account.

When you refresh the page, you should see the contract instance being output to the console.

# Reading from the Contract

Let's interact with the contract.  Let's use the [totalSupply()](https://github.com/OpenZeppelin/zeppelin-solidity/blob/0926729c8f19f6ed147c46f5c893a012be815a5a/contracts/token/ERC20/BasicToken.sol#L22) function to get the total supply of tokens and populate the index.html with it.  We'll make it a function so we can call it elsewhere.

Below our main 'hero' section in `build/index.html` let's add a header for the total supply:

```html
  <section class='section'>
    <div class='container has-text-centered'>
      <p class="heading">Tokens in Circulation</p>
      <p class="title" id='total-supply'>Unknown</p>
    </div>
  </section>
```

Now let's update it with a function:

```javascript
// build/index.js
var MyToken;

function updateTotalSupply() {
  MyToken.totalSupply().then(function (data) {
    $('#total-supply').html(data.toString());
  })
}

$(document).ready(function () {
  $.getJSON('/contracts/MyToken.json').then(function (data) {
    var MyTokenContract = TruffleContract(data)
    MyTokenContract.setProvider(web3.currentProvider)
    MyTokenContract.deployed().then(function (instance) {
      MyToken = instance;
      updateTotalSupply();
    })
  })
})
```

When we refresh the page we should now see 'Unknown' get replaced with '0'. Cool!  Let's mint some tokens.

# Writing to the Contract

Since we are logged-in as the account that deployed the code, we will be allowed to mint tokens.  Let's use the [mint()](https://github.com/OpenZeppelin/zeppelin-solidity/blob/0926729c8f19f6ed147c46f5c893a012be815a5a/contracts/token/ERC20/MintableToken.sol#L31) function to mint some new tokens for ourselves.

First let's add a mint button just below the total supply:

```html
<section class='section'>
  <div class='container has-text-centered'>
    <p class="heading">Tokens in Circulation</p>
    <p class="title" id='total-supply'>Unknown</p>
    <button class='button is-primary is-medium' id='mint'>Mint</button>
  </div>
</section>
```

Now let's have it mint tokens:

```javascript
// build/index.js

// ...

function mint() {
  MyToken.mint(web3.eth.accounts[0], 1000)
}

$(document).ready(function () {
  $('#mint').on('click', mint)
  // ...
})
```

Now when you refresh the page and click the button MetaMask will present you with a transaction confirmation dialog.  You can see the gas estimate and configure the limits and gas price.  Just click 'Submit' to submit the transactions.  After a few seconds refresh the page and you should see the newly minted tokens!  If it doesn't work give it a second and refresh again.

# Listening to Events

It's annoying that we have to refresh the page to see the update.  Instead, let's use the [Mint event](https://github.com/OpenZeppelin/zeppelin-solidity/blob/0926729c8f19f6ed147c46f5c893a012be815a5a/contracts/token/ERC20/MintableToken.sol#L34) that is logged by the smart contract when new tokens are minted.

We can listen to Ethereum events using the contract API.  Let's update the contract instance initializer so that we also listen for Mint events:

```javascript
MyTokenContract.deployed().then(function (instance) {
  MyToken = instance;
  var Mint = MyToken.Mint()
  Mint.watch(function (error, result) {
    if (error) console.error(error)
    else updateTotalSupply();
  })
  updateTotalSupply();
})
```

Now refresh the page and click the button: we can see the total supply increase!

# The Joys of ERC-20

Because we have implemented the token using the ERC-20 standard, MetaMask will be able to inspect it.  Copy the MyToken contract address from the compilation artifact.  Now click on MetaMask in the browser, click on the tokens tab, and click 'Add Token'.  In the form paste the address of the contract.  The rest of the fields should update.

Since you've been minting the tokens to yourself (i.e. your first account at web3.eth.accounts[0]), you'll be able to see your token balance!  Cool eh?

# Next steps

That's it for functionality.  I'm going to leave it to the reader to implement account balances and transfers.  Next we'll tackle deploying to Ropsten.
