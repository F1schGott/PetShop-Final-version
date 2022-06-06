

//array to keep track of the previous favourite counter per pet
var past_fav_counter= []

App = {
  web3Provider: null,
  contracts: {},
  display_list: {},
  adopter_list: {},
  donate_amount: 0,


  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {

      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      App.display_list = {};
      display_index = 0

      for (i = 0; i < data.length; i++) {
        App.display_list[i] = display_index;
        display_index += 1;
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        petTemplate.find('.btn-vaccinate').attr('data-id', data[i].id);
        //ADDED- for favorite button
        petTemplate.find('.btn-favorite').attr('data-id', data[i].id); // To make the petid accessible for favorite button

        //ADDED - to reflect the id of the deadopt button
        petTemplate.find('.btn-deadopt').attr('data-id', data[i].id);

        //ADDED - to gift friend
        petTemplate.find('.btn-giftfriend').attr('data-id', data[i].id);
        petTemplate.find('.input-giftfriend').attr('id', "giftfriend"+data[i].id);

        //ADDED- donate ETH to pet button
        petTemplate.find('.btn-donate').attr('data-id', data[i].id);

        //ADDED - donate ETH donate options. E.g. donate 1 ETH, 2 ETH, etc..
        petTemplate.find('.btn-btn-d1').attr('data-id', data[i].id);
        petTemplate.find('.btn-btn-d2').attr('data-id', data[i].id);
        petTemplate.find('.btn-btn-d5').attr('data-id', data[i].id);
        petTemplate.find('.btn-btn-d10').attr('data-id', data[i].id);
        petTemplate.find('.btn-btn-d50').attr('data-id', data[i].id);

        // ADDED - to keep track of past fav counter to check if user has liked this pet already or not
        past_fav_counter.push(0);
        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {

        // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets and vaccinated pets
      App.markVaccinated();
      return App.markAdopted();

    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    //ADDED - to reflect the vaccinate button
    $(document).on('click', '.btn-vaccinate', App.handleVaccinate);
    //ADDED - to reflect the Favorite button
    $(document).on('click','.btn-favorite', App.handleFavorite);
    //ADDED - to reflect the deadopt button
    $(document).on('click', '.btn-deadopt', App.reverseAdopt);
    //ADDED - to gift friend
    $(document).on('click', '.btn-giftfriend', App.giftFriend);
    //ADDED - to donate ETH
    $(document).on('click', '.btn-donation', App.handleDonate);
  },


  markAdopted: function(adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {

        //for petId i go to markfavourited to retrieve the number of times the pet was favourited by a unique user
        App.markFavorited(i);

        App.adopter_list[i] = adopters[i]

        display_index = App.display_list[i]


        if (display_index !== -1){
          // interface if pet adopted
          if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
            $('.panel-pet').eq(i).find('.btn-adopt').text('Adopt').attr('disabled', true);
            //if a pet is adopted cannot be favorited
            $('.panel-pet').eq(i).find('.btn-favorite').text('Favorite').attr('disabled', true);
            $('.panel-pet').eq(i).find('.btn-deadopt').text('Dedopt').attr('disabled', false);
            $('.panel-pet').eq(i).find('.btn-giftfriend').text('Give to Friend').attr('disabled', true);
            $('.panel-pet').eq(i).find('.input-giftfriend').attr('disabled', "disabled");

          } else {
            //interface if pet not adopted
            $('.panel-pet').eq(i).find('.btn-adopt').text('Adopt').attr('disabled', false);
            $('.panel-pet').eq(i).find('.btn-favorite').text('Favorite').attr('disabled', false);
            $('.panel-pet').eq(i).find('.btn-deadopt').text('Deadopt').attr('disabled', true);
            $('.panel-pet').eq(i).find('.btn-giftfriend').text('Give to Friend').attr('disabled', false);
            $('.panel-pet').eq(i).find('.input-giftfriend').attr('disabled', false);

          }

          if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
            document.getElementsByClassName("btn btn-default btn-adopt")[display_index].innerHTML = "Adopted";
            document.getElementsByClassName("btn btn-default btn-adopt")[display_index].disabled = true;
          }
          // Vaccinated button will only become available when the pet has been adopted
          if (document.getElementsByClassName("btn btn-default btn-adopt")[display_index].disabled == false){
            document.getElementsByClassName("btn btn-default btn-vaccinate")[display_index].disabled = true;
          }else {
            document.getElementsByClassName("btn btn-default btn-vaccinate")[display_index].disabled = false;
          }


        }

      }
      App.markVaccinated();
    }).catch(function(err) {
      console.log(err.message);
    });


  },

    //ADDED - Filter function 

    Filter: function() {
      var breed = document.getElementById("selectedBreed").value;
      var age = document.getElementById("selectedAge").value;
      var adoptable = document.getElementById("toggleswitch").checked;
      App.updateFilteredPets(breed, age, adoptable)
    },

    //ADDED - Filter main function 
    updateFilteredPets(breed, age, adoptable) {

      App.display_list = {}
      display_index = 0
      $.getJSON('../pets.json', function(data) {

        const petsRow = document.getElementById("petsRow");
        var petTemplate = $('#petTemplate');
        petsRow.innerHTML = ""

        for (i = 0; i < data.length; i++) {
          App.display_list[i] = -1
              if (data[i].breed == breed || breed == "all") {
                if (data[i].age == age || age == "all"){
                  if (App.adopter_list[i] == '0x0000000000000000000000000000000000000000' || adoptable == false){
                      App.display_list[i] = display_index;
                      display_index += 1;
                      petTemplate.find('.panel-title').text(data[i].name);
                      petTemplate.find('img').attr('src', data[i].picture);
                      petTemplate.find('.pet-breed').text(data[i].breed);
                      petTemplate.find('.pet-age').text(data[i].age);
                      petTemplate.find('.pet-location').text(data[i].location);
                      petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
                      petTemplate.find('.btn-vaccinate').attr('data-id', data[i].id);
                      petTemplate.find('.btn-favorite').attr('data-id', data[i].id); // To make the petid accessible for favorite button
                      //ADDED - to reflect the id of the deadopt button
                      petTemplate.find('.btn-deadopt').attr('data-id', data[i].id);
                      //ADDED - to gift friend
                      petTemplate.find('.btn-giftfriend').attr('data-id', data[i].id);
                      //ADDED - to gift friend
                      petTemplate.find('.input-giftfriend').attr('id', "giftfriend"+data[i].id);

                      petTemplate.find('.btn-donate').attr('data-id', data[i].id);
                      petTemplate.find('.btn-btn-d1').attr('data-id', data[i].id);
                      petTemplate.find('.btn-btn-d2').attr('data-id', data[i].id);
                      petTemplate.find('.btn-btn-d5').attr('data-id', data[i].id);
                      petTemplate.find('.btn-btn-d10').attr('data-id', data[i].id);
                      petTemplate.find('.btn-btn-d50').attr('data-id', data[i].id);

                      petsRow.innerHTML += petTemplate.html()
                  }
                }
              }
          }

          if ( petsRow.innerHTML == "") {
            petsRow.innerHTML += "No result"
          }
      });

      App.markAdopted();

    },

  //ADDED - Search function 


  Search: function() {
    var keyword = document.getElementById("searchbar").value.toLowerCase()
    App.SearchPets(keyword)
  },

  //ADDED - Search main function 
  SearchPets(keyword) {
    App.display_list = {}
    display_index = 0
    $.getJSON('../pets.json', function(data) {


        const petsRow = document.getElementById("petsRow");
        var petTemplate = $('#petTemplate');
        petsRow.innerHTML = ""

        for (i = 0; i < data.length; i++) {
          App.display_list[i] = -1
          var name_bool = Boolean(data[i].name.toLowerCase().indexOf(keyword) > -1)
          var location_bool = Boolean(data[i].location.toLowerCase().indexOf(keyword)> -1)
          if ( name_bool || location_bool) {
            App.display_list[i] = display_index;
            display_index += 1;
            petTemplate.find('.panel-title').text(data[i].name);
            petTemplate.find('img').attr('src', data[i].picture);
            petTemplate.find('.pet-breed').text(data[i].breed);
            petTemplate.find('.pet-age').text(data[i].age);
            petTemplate.find('.pet-location').text(data[i].location);
            petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

            petsRow.innerHTML += petTemplate.html()
          }


        }
        if ( petsRow.innerHTML == "") {
          petsRow.innerHTML += "No result"
        }
    });

    App.markAdopted();
  },

   //ADDED - to donate ETH to pet

   handleDonate: function(event) {

    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var donationInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        donationInstance = instance;

        // Execute adopt as a transaction by sending account
        return donationInstance.donate(petId, {from: account, value: web3.toWei(String(App.donate_amount), 'ether')  });

      }).then(function(result) {
        alert('Thank you for your donation!');
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },



   //ADDED - to reverse adoption
   reverseAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));
    var adoptionInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;
        // Execute adopt as a transaction by sending account
        return adoptionInstance.deadopt(petId, {from: account});
      }).then(function(result) {

        App.contracts.Adoption.deployed().then(function(instance) {
          adoptionInstance = instance;
          //Update this
          return adoptionInstance.getAdopters.call();
        }).then(function(adopters) {

          // only users who adopted the pet can deadopt it
          if (adopters[petId] != '0x0000000000000000000000000000000000000000'){
            alert("This user cannot deadopt this pet because they are not the adopters. Only Current Pet Adopters can deadopt a pet")
          }
        }).catch(function(err) {
          console.log(err.message);
        });

        return App.markAdopted();



      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  // added to adopt the pet and give it to a friend
  giftFriend: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));
    var friend_address = $('#giftfriend'+petId).val();

    var adoptionInstance;

    // check if the input is blank
    if(friend_address ==""){
      alert("The address is empty, please insert friend address")
    }else{

      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }

        var account = accounts[0];

        App.contracts.Adoption.deployed().then(function(instance) {
          adoptionInstance = instance;
          // Execute adopt as a transaction by sending account
          return adoptionInstance.gifttofriend(petId, friend_address, {from: account});
        }).then(function(result) {
          return App.markAdopted();
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    }
  },

  //ADDED - Retrieve adoption history 
  historyAdoption: function(adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {

      $('#adoptionHistory').html('');
      $.getJSON('../pets.json', function(data) {
        // assumes that adopters and the return from the pet json file are the same size
        for (i = 0; i < adopters.length; i++) {
          //UPDATED - to reflect the adoption history
          if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
            $("#adoptionHistory").append("Adopter: " + adopters[i] +  " adopted pet with id " + i + " and name "+ data[i].name +"<br>");
          }
        }
      })
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  //ADDED - Retrieve vaccination history
  historyVaccinations: function(vaccinates, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getVacciPets.call();
    }).then(function(vaccinates) {

      $('#vaccinationHistory').html('');
      $.getJSON('../pets.json', function(data) {
        // assumes that adopters and the return from the pet json file are the same size
        for (i = 0; i < vaccinates.length; i++) {
          //UPDATED - to reflect the adoption history
          if (vaccinates[i] !== '0x0000000000000000000000000000000000000000') {
            $("#vaccinationHistory").append("User: " + vaccinates[i] +  " vaccinated pet with id " + i + " and name "+ data[i].name +"<br>");
          }
        }
      })
    }).catch(function(err) {
      console.log(err.message);
    });
  },



  // Added - Handle Favorite function
  handleFavorite: function(event){
    event.preventDefault();
    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.favourite(petId, {from: account})

      }).then(function(result) {

        App.contracts.Adoption.deployed().then(function(instance) {
          adoptionInstance = instance;
          //Update this
          return adoptionInstance.getFavs.call(petId);
        }).then(function(favoriters) {


          // if the past_fav_counter is equal to the current fav counter,
          // based on the structure of the contract, it means that the users
          //has already favourited this pet before
          if (past_fav_counter[petId]== favoriters.toNumber()){
            alert("This user has already favourited this pet before! Hence the count of Favouriters will remain the same!")
          }

          // update past fav past_fav_counter
          past_fav_counter[petId]= favoriters.toNumber();


          $.getJSON('../pets.json', function(data) {


            $('.panel-pet').eq(petId).find('.pet-favorite').text(favoriters.toNumber());

          })
        }).catch(function(err) {
          console.log(err.message);
        });

      }).catch(function(err) {
        console.log(err.message);
      });
    });


  },

  // Added - Mark Favorite function
  markFavorited: function(petId,favoriters,account){
    var adoptionInstance;
    // alert('I am vaccinated, thank you!')
    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getFavs.call(petId);
    }).then(function(favoriters) {
      $('.panel-pet').eq(petId).find('.pet-favorite').text(favoriters.toNumber());
      past_fav_counter[petId]=favoriters.toNumber();

    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  // Added - Mark Vaccinate function
  markVaccinated: function(vaccinates,account){
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getVacciPets.call();
    }).then(function(vaccinates) {
      for (i = 0; i < vaccinates.length; i++) {
        display_index = App.display_list[i]

        if(display_index !== -1){

          if (vaccinates[i] !== '0x0000000000000000000000000000000000000000') {

            document.getElementsByClassName("btn btn-default btn-vaccinate")[display_index].innerHTML = "I'm Vaccinated!";
            document.getElementsByClassName("btn btn-default btn-vaccinate")[display_index].style.background='#FF0000';
            document.getElementsByClassName("btn btn-default btn-vaccinate")[display_index].disabled = true

          }
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

// Added - handle Vaccinate function
  handleVaccinate: function(event) {
    event.preventDefault();
    alert("Your pet will be vaccinated, please note that this cannot be reversed!");
    var petId = parseInt($(event.target).data('id'));
    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.vaccinate(petId, {from: account});
      }).then(function(result) {
        return App.markVaccinated();
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
