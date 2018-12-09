const request = require('request');

const uptobox = (() => {
  var cookieJar;
  var _userAgent = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.132 Safari/537.36';

  let strstr = (istring, search) => {
    var position = istring.indexOf(search);
    if (position == -1) return istring;
    return istring.slice(position);
  };

  let _login = async (username, password) => {
    return new Promise(function(resolve, reject) {
      cookieJar = request.jar();
      request({
        url: 'https://uptobox.com/?op=login&referer=homepage',
        method: 'POST',
        headers: {
          'User-Agent': _userAgent
        },
	jar: cookieJar,
        form: {
          login: username,
          password: password
        }
      }, (err, res) => {
        if (err) reject('Unable to login to Uptobox');
	if (res && res.headers && res.headers['set-cookie']) {
	  res.headers['set-cookie'].forEach((cookie) => {
            if ((cookie.indexOf('xfss=') !== -1) && (cookie.indexOf('xfss=deleted' === -1)))
              resolve();
          });
        }
        reject();
      });
    });
  };

  let _getDownloadLink = async (link) => {
    return new Promise(function(resolve, reject) {
      link = link.replace('http://', 'https://').replace('uptostream.com', 'uptobox.com');
      request({
        url: link,
        method: 'GET',
        headers: {
          'User-Agent': _userAgent,
        },
        jar: cookieJar
      }, (err, res) => {
        if (err || (!res && !res.body)) reject('Unable to debrid link!');
        let result = strstr(res.body, "<div class='mt-5'>");
        result = strstr(result, "<a href=").slice(9);
        resolve(result.substring(0, result.indexOf('"')));
      });
    });
  };
	
  let _getStreamingLinks = async (link) => {
    return new Promise(function(resolve, reject) {
      let synthesis = {};
      link = link.replace('http://', 'https://').replace('uptobox.com', 'uptostream.com');
      request({
        url: link,
        method: 'GET',
        headers: {
          'User-Agent': _userAgent,
        },
        jar: cookieJar
      }, (err, res) => {
        if (err || (!res && !res.body)) reject('Unable to debrid link!');
	if (res.body.indexOf('503 Service Temporarily Unavailable') !== -1) reject('UNAVAILABLE');
	if (res.body.indexOf('The server is under maintenance, try later or download it on Uptobox.') !== -1) reject('MAINTENANCE');

        let title = strstr(res.body, "<h1 class='file-title'>").slice(23);
	title = title.substring(0, title.indexOf("</h1>"));

	let data = strstr(res.body, "var filename = '").slice(16);
        data = data.substring(0, data.indexOf("</script>"));

	let poster = strstr(data, "poster: '").slice(9);
	poster = poster.substring(0, poster.indexOf("',"));

        let sources = strstr(data, "window.sources = JSON.parse('").slice(29);
	sources = sources.substring(0, sources.indexOf("');"));
	sources = JSON.parse(sources);

        // Get links
        let links = {};
        sources.forEach((source) => {
                if (links[source.lang] === undefined) links[source.lang] = [];
		links[source.lang].push({[source.res]: source.src});
	});

        // Get subtitles data
	let srt = [];
	let tracks = res.body;
        while(tracks.indexOf("<track") !== -1) {
          tracks = strstr(tracks, "<track").slice(6);
          let track = strstr(tracks, "src='").slice(5);
          let trackSrc = track.substring(0, track.indexOf("'"));
          track = strstr(track, "label='").slice(7);
          let trackLabel = track.substring(0, track.indexOf("'"));
          srt.push({[trackLabel]: trackSrc});
	}

        // Create synthesis
        if ((Object.keys(links).length > 0) && (poster.length > 0) && (Object.keys(srt).length > 0)) {
          synthesis['title'] = title;
          synthesis['poster'] = poster;
          synthesis['links'] = links;
          synthesis['thumbnail'] = poster.replace('_big.jpg', '_mini.jpg');
          synthesis['subtitles'] = srt;
          resolve(synthesis);
        } else {
          reject('DEADLINK');
        }
      });
    });
  };

  return {
    login: (username, password) => {
      return _login(username, password);
    },

    getDownloadLink: (link) => {
      return _getDownloadLink(link);
    },

    getStreamingLinks: (link) => {
      return _getStreamingLinks(link);  
    }
  };
})();

module.exports = uptobox;
