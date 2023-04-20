var axios = require("axios");

function harperSaveMessage(message, username, room) {
  const dbUrl = process.env.HARPERDB_URL;
  const dbPw = process.env.HARPERDB_PW;
  if (!dbUrl || !dbPw) return null;

  var data = JSON.stringify({
    operation: "insert",
    schema: "chatapp",
    table: "messages",
    records: [
      {
        message,
        username,
        room,
      },
    ],
  });

  var config = {
    method: "post",
    url: "https://cloud-cbikas.harperdbcloud.com",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic dmNiaWthc2g6QmlrYXNAMTIzIUAj",
    },
    data: data,
  };

  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        resolve(JSON.stringify(response.data));
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

module.exports = harperSaveMessage;