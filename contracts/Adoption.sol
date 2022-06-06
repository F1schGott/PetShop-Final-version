pragma solidity ^0.5.0;

contract Adoption {
address[16] public adopters;
address[16] public vaccinated;
address[16] public donaters;

//dynamic array
address[][16] public favs;


// Adopting a pet
function adopt(uint petId) public returns (uint) {
  require(petId >= 0 && petId <= 16);

  adopters[petId] = msg.sender;

  return petId;
}

// Retrieving the adopters
function getAdopters() public view returns (address[16] memory) {
  return adopters;
}

// vaccinate a pet (irreversible)
function vaccinate(uint petId) public returns (uint) {
  require (petId >= 0 && petId <= 16);
  vaccinated[petId] = msg.sender;
  return petId;
}

// get vaccinated pets
function getVacciPets() public view returns (address[16] memory) {
   return vaccinated;
}

// gift the pet to friend. Adopt a pet and give it a friend's address
function gifttofriend(uint petId, address friend_address) public returns (uint) {

  adopters[petId] = friend_address;
  return petId;
}

// deadopt pet
function deadopt(uint petId) public returns (uint) {

  // only the user who is currently adopting the pet can deadopt it
  if(adopters[petId] == msg.sender){
    adopters[petId] = 0x0000000000000000000000000000000000000000;
  }

  return petId;
}

// Donating ETH to a pet
function donate(uint petId) public payable returns (uint) {
  require(petId >= 0 && petId <= 16);

  donaters[petId] = msg.sender;

  return petId;
}

// Retrieving the donaters who donated ETH to pet
function getDonaters() public view returns (address[16] memory) {
  return donaters;
}

// Favourting a pet // this function keeps a count of number of times a pet was favourited
function favourite(uint petId) public returns (bool) {
  require(petId >= 0 && petId <= 16);
  bool alreadyfavourited = false;

  // check if the pet was already favourited by this user address
  for (uint i =0; i<favs[petId].length ; i++){
    if (favs[petId][i] == msg.sender){
      alreadyfavourited = true;
    }
  }

  // if pet was not favourited by this user address yet, then add the user address to the favs dynamic array
  if (alreadyfavourited ==false){
    favs[petId].push(msg.sender);
  }

  return alreadyfavourited;
}

// Return the count of unique users who favourited the pet
function getFavs(uint petId) public returns (uint val) {
  return favs[petId].length;
}


}
