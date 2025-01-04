import axios from 'axios';

axios.get('http://www.bbc.co.uk')
    .then(function (response) {
        console.log(response);
    })
    .catch(function(error) {
        console.log(error);
    })
    .finally(function() {
        console.log('This bit of code is always executed at the end');
    })
