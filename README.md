# Node-uptobox
Simple node library to get uptobox premium links

## Use examples
### Get debrided direct download link
```
const uptobox = require('uptobox-request');

uptobox.login(uptobox_username, uptobox_password).then(() => {
  uptobox.getDownloadLink(uptobox_link).then((result) => {
      console.log(result);
  }, () => console.error('Failed to get download link !');
}, () => console.error('Login failed !'));
```

### Get debrided streaming links
```
const uptobox = require('uptobox');

uptobox.login(uptobox_username, uptobox_password).then(() => {
  uptobox.getStreamingLinks(link).then((result) => {
      console.log(result);
  }, () => console.error('Failed to get streaming links !');
}, () => console.error('Login failed !'));
```

### Expected results
- getDownloadLink return directly the download link as a string or an error
- getStreamingLinks return the bellow structure or an error:
```
{
  title: 'video_title',
  poster: 'video_poster.jpg',
  links: [ 
    'video_language': [
      {
        'video_resolution': 'video_link.mp4'
      }
    ]
  ],
  thumbnail: 'video_thumbnail.jpg',
  subtitles: [
    {
      'track_label': 'track_src.vtt'
    }
  ]
}
```
