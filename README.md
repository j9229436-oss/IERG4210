# IERG4210
# I want to declare some use of AI here 
# There are functions in this where there will be changes as to how the webpage would react to different screens
# E.g. like phone screens / full computer screens
# That part I asked AI on "how do i adjust my webpage size according to the device size of user"

//use of AI: how to set up the server online to AZURE
//then used npm start and fixed things in VM directly instead of coding
//AI solution: sudo nano /etc/nginx/sites-available/default then
/*server {
    listen 80;
    server_name 20.199.85.138;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images directly
    location /uploads/ {
        root /home/IERG4210/website;
    }

    # Serve static files (public folder)
    location /public/ {
        root /home/IERG4210/website;
    }
}
*/
//then I keep the node listening by screen -S nodeapp and npm start
//then restart sudo systemctl restart nginx
//then now i can see my code on http://20.199.85.138/

//last time is static website, so i don't have to do the above, but right now i have backend so i have to make ammends

Why CDN was blocked
Your Content Security Policy (CSP) said:

text
script-src 'self'; style-src 'self' 'unsafe-inline';
That means: only scripts and styles hosted on your own domain are allowed.

When you referenced https://cdn.jsdelivr.net/..., the browser blocked it because it wasn’t 'self'.

🔍 Why local files work
When you put swiper-bundle.min.js and swiper-bundle.min.css inside /public/js/ and /public/css/, they’re served from https://s21.ierg4210.iecuhk.cc/js/... and https://s21.ierg4210.iecuhk.cc/css/....

That matches 'self' in your CSP, so the browser allows them.

Result: Swiper loads, Swiper is not defined disappears, and your slider initializes.

⚙️ Key takeaway
CSP is strict: it only allows what you explicitly list. By hosting libraries locally, you avoid the need to keep whitelisting external CDNs. Everything comes from your own domain, so 'self' covers it automatically.