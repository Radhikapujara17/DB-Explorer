import http from 'http';

http.get('http://localhost:8080', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Includes canonical:', d.includes('rel="canonical"') || d.includes("rel='canonical'") || d.includes('canonical'));
    const allLinks = d.match(/<link[\s\S]*?>/g) || [];
    console.log('Total <link> tags:', allLinks.length);
    console.log('All links:\n', allLinks.join('\n'));
  });
});
