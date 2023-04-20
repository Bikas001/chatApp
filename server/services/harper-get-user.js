let axios = require("axios");

function getUser(email) {
  let data = JSON.stringify({
    operation: "sql",
    sql: `SELECT * FROM chatapp.users WHERE email = '${email}'`,
  });

  let config = {
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
        resolve(response.data);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

module.exports = getUser;
