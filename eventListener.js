const Web3 = require("web3");
const contractAbi = require("./contracts/Lottery.json");
const enviroment = require("./environment");

var web3 = openConnection();

const contractAddress = "0x3784814b44c26E371f74291ED0B60c4D2F698058";
const publicAddress = "0xB0606B70bEfa0fB3A9E6E933382192E5567B723a";
const privateKey =
  "5b736da13aaf0393b81a19672de3c4df17a2ab9e546558d49a0cc113afe54604";

var contract = new web3.eth.Contract(contractAbi.abi, contractAddress);

function newListener() {
  console.log("New Subscription");
  contract.events.STicketPurchased({}, async function (error, event) {
    if (event) {
      console.log("Ticket Purchased=================");
      const addresses = await contract.methods
        .getDPoolPlayers()
        .call()
        .then((data) => {
          return data;
        });
      if (addresses.length == 2) {
        setTimeout((_) => {
          triggerRunChecks();
        }, Math.floor(Math.random() * (120000 - 60000 + 1) + 60000));
      }
    } else if (error) {
      console.log("Connection error: " + JSON.stringify(error));
      web3 = openConnection();
      contract = new web3.eth.Contract(contractAbi.abi, contractAddress);
      newListener();
    }
  });
}

function openConnection() {
  let auxWeb3 = new Web3(
    new Web3.providers.WebsocketProvider(enviroment.web3Provider_ws, {
      headers: {
        Origin: enviroment.originHeader,
      },
    })
  );
  auxWeb3.eth.net
    .isListening()
    .then((res) => {
      console.log("Is connected");
    })
    .catch((e) => {
      console.log("Lost connection" + e);
    });
  return auxWeb3;
}

newListener();

async function triggerRunChecks() {
  let web3 = new Web3(
    new Web3.providers.HttpProvider(enviroment.web3Provider_http)
  );

  var contract = new web3.eth.Contract(contractAbi.abi, contractAddress);

  const data = await contract.methods.triggerRunChecks();
  const txData = data.encodeABI();
  console.log(data.encodeABI());

  const gas = await data.estimateGas({
    from: publicAddress,
  });
  console.log(gas);

  const gasPrice = await web3.eth.getGasPrice();
  console.log(gasPrice);
  const nonce = await web3.eth.getTransactionCount(publicAddress);
  console.log(nonce);
  const tx = {
    to: contractAddress,
    // this could be provider.addresses[0] if it exists
    from: "0xB0606B70bEfa0fB3A9E6E933382192E5567B723a",
    // target address, this could be a smart contract address
    data: txData,
    gas: gas,
    gasPrice: gasPrice,
    nonce: nonce,
    chainId: enviroment.chainId,
  };

  const signPromise = await web3.eth.accounts.signTransaction(tx, privateKey);
  console.log(signPromise);
  const receipt = await web3.eth.sendSignedTransaction(
    signPromise.rawTransaction
  );
  console.log(`Transaction hash: ${receipt.transactionHash}`);
}
