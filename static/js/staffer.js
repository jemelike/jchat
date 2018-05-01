var ipaddress = '127.0.0.1'
let buildQuotebox = (messages, id) => {
  jQuery('<p/>', {
    id: 'message' + id + messages.sender,
  }).appendTo('#messages')
  jQuery('<p/>', {

    class: 'message_staffer',
    text: "" + messages.sender + ":\n" + messages.messages
  }).appendTo('#message' + id + messages.sender);
  //$('#messages').append()
}

let loadMessages = (chatID) => {
  let promise = new Promise((resolve, reject) => {
    let all_messages = $.ajax({
      url: "http://localhost:8080/messages_sent",
    })

    if (all_messages) {
      resolve(all_messages)
    }
    else
      reject(Error("Failed"))
  })

  promise.then((data) => {
    console.log(data)
    let currrent = data.message.filter(message => message.chatID === chatID)
    console.log(currrent)

    currrent.map((messages, id) => {
      if (messages.messages) {
        buildQuotebox(messages, id)
      }
    })
  })
}

$(document).ready(() => {
  var chat = io.connect('http://' + ipaddress + ':8080/chat')
  var queue = io.connect('http://' + ipaddress + ':8080/queue')
  

  //loadMessages('survivor-1')

  $('#send').click(function () {
    var chat_promise = new Promise((resolve, reject) => {
      let message = $('#message').val()
      let user = $('#username').val()

      //Set user if it is empty
      if(!user)
        user = "Staffer1"

      let msg_info = {message, user}
      
      //Check if message is empty. User is not relavant 
      if (message) {
        console.log(msg_info)
        resolve(msg_info)
      }
      else {
        reject(Error("Message not retrieved"))
      }
    })

    chat_promise.then((message) => {
      console.log(message)
      $.ajax({
        type: "POST",
        url: "http://localhost:8080/messages",
        data: { message: message.message, sender: message.user, chatID: "survivor-1" },
        success: (data) => console.log('You have sent a message'),
        contetType: "application/json",
        dataType: 'json'
      })
      
      console.log('Pre-send')
        chat.emit('chat-message', { message, chatID: 'survivor-1' }).once();
        $('#message').val('');
      
    })

    return false;
  });

  chat.on('chat-message', (msg) => {
    console.log(msg)
    $('#messages').append("<p class='message_staffer'>" + msg.message.user + ":\n" + msg.message.message + "\n\n" +"</p>");
    window.scrollTo(0, document.body.scrollHeight);
  });

  //increment counter
  queue.on('new-person-eng', (increment) => {
    
    $(document).remove('#ENG')
    $('#ENG-HOLDER').append(increment.length)

  })
})