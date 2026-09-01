# Badminton Tracker

This is the tracker that i built in nextjs and convex and workos for me and my friends.

It also uses google sheet for storing score with user id so that convex storage does that full on convex for scores. i got idea to build this when we play badminton daily. 

how to run this project, 

you can clone this project using

```
git clone https://github.com/rubixnet/badminton/
```

then install packages

``` 
bun install
```

then run using 

```
bun run dev
```

you will also need the following keys from workos and convex 

```
WORKOS_API_KEY="YOUR_KEY_HERE"

WORKOS_COOKIE_PASSWORD="YOUR_KEY_HERE"

WORKOS_CLIENT_ID="YOUR_KEY_HERE"

JWT_SECRET="YOUR_KEY_HERE"

CONVEX_DEPLOYMENT=dev:replace-with-your-project-id-after-dev

NEXT_PUBLIC_CONVEX_URL=https://cloud-convex-url.convex.cloud

NEXT_PUBLIC_CONVEX_SITE_URL=https://site-convex-url.convex.site

```

you will also need to create credintials in google cloud at 
`https://console.cloud.google.com/apis/credentials?` this link and add it to workos,

or you can use workos demo ocredintials as well, 

after this you are setup but you will also need to have google sheet and private id along with 
service account email 
`
GOOGLE_SHEET_ID="GOOGLE_SHEET_ID" # get this from sheets.google.com
GOOGLE_PRIVATE_KEY="private_google_key_here-begining with begin private key and ending with end private key"
and google service account email which is a hassle if you want to get this, 

so dm me for this i will add it here anyway! 
