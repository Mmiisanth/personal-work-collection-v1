import type { Artist } from "@/lib/types";

type ArtistRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  Artist["links"],
];

const artistRows: ArtistRow[] = [
  ["taylor-swift","Taylor Swift","Taylor","交","#d9d0ff","267,199,000","156,317,149 followers","14 wins / 58 noms / GF 4/0/0/0","75 / 67",{"grammy":"https://www.grammy.com/search/Taylor%20Swift","aoty":"https://www.albumoftheyear.org/artist/323-taylor-swift/","rym":"https://rateyourmusic.com/artist/taylor-swift","RC":"https://www.robertchristgau.com/get_artist.php?name=Taylor+swift","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["lady-gaga","Lady Gaga","Gaga","尖","#b8ff9c","105,002,000","46,188,120 followers","16 wins / 45 noms / GF 0/0/0/0","69 / 75",{"grammy":"https://www.grammy.com/search/Lady%20Gaga","aoty":"https://www.albumoftheyear.org/artist/686-lady-gaga/","rym":"https://rateyourmusic.com/artist/lady-gaga","RC":"https://www.robertchristgau.com/get_artist2.php?id=6176","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["katy-perry","Katy Perry","Katy","厕","#ffd2ea","82,302,000","40,296,598 followers","0 wins / 13 noms / GF 0/0/0/0","52 / 53",{"grammy":"https://www.grammy.com/search/Katy%20Perry","aoty":"https://www.albumoftheyear.org/artist/187-katy-perry/","rym":"https://rateyourmusic.com/artist/katy-perry","RC":"https://www.robertchristgau.com/get_artist.php?name=katy+perry","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["adele","Adele","Adele","猪","#eaff3d","122,272,000","70,136,046 followers","16 wins / 25 noms / GF 2/2/2/1","73 / 76",{"grammy":"https://www.grammy.com/search/Adele","aoty":"https://www.albumoftheyear.org/artist/7-adele/","rym":"https://rateyourmusic.com/artist/adele-1","RC":"https://www.robertchristgau.com/get_artist.php?name=adele","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["rihanna","Rihanna","Rihanna","沙","#9ce9ff","267,199,000","73,322,133 followers","9 wins / 34 noms / GF 0/0/0/0","65 / 71",{"grammy":"https://www.grammy.com/search/Rihanna","aoty":"https://www.albumoftheyear.org/artist/1365-rihanna/","rym":"https://rateyourmusic.com/artist/Rihanna","RC":"https://www.robertchristgau.com/get_artist.php?name=Rihanna","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["lana-del-rey","Lana Del Rey","Lana","鳄","#cfcfcf","66,458,000","56,896,165 followers","0 wins / 11 noms / GF 0/0/0/0","73 / 80",{"grammy":"https://www.grammy.com/search/Lana%20Del%20Rey","aoty":"https://www.albumoftheyear.org/artist/1969-lana-del-rey/","rym":"https://rateyourmusic.com/artist/lana-del-rey","RC":"https://www.robertchristgau.com/get_artist.php?name=Lana+Del+Rey","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["lorde","Lorde","Lorde","low","#b4a7ff","20,723,000","10,825,146 followers","2 wins / 5 noms / GF 0/0/1/0","77 / 80",{"grammy":"https://www.grammy.com/search/Lorde","aoty":"https://www.albumoftheyear.org/artist/3963-lorde/","rym":"https://rateyourmusic.com/artist/lorde","RC":"https://www.robertchristgau.com/get_artist.php?name=Lorde","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["beyonce","Beyonce","Beyonce","猩","#ffb347","115,155,000","42,651,410 followers","35 wins / 99 noms / GF 1/0/1/0","76 / 80",{"grammy":"https://www.grammy.com/search/Beyonce","aoty":"https://www.albumoftheyear.org/artist/1819-beyonce/","rym":"https://rateyourmusic.com/artist/beyonce","RC":"https://www.robertchristgau.com/get_artist.php?name=Beyonce","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["britney-spears","Britney Spears","Britney","头","#ff9ed8","127,733,000","19,107,079 followers","3 wins / 20 noms / GF 0/0/0/0","59 / 71",{"grammy":"https://www.grammy.com/search/Britney%20Spears","aoty":"https://www.albumoftheyear.org/artist/886-britney-spears/","rym":"https://rateyourmusic.com/artist/britney-spears","RC":"https://www.robertchristgau.com/get_artist.php?name=Britney+Spears","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["ariana-grande","Ariana Grande","Ariana","炸","#f5c6ff","100,783,000","111,421,682 followers","3 wins / 20 noms / GF 0/0/0/0","73 / 74",{"grammy":"https://www.grammy.com/search/Ariana%20Grande","aoty":"https://www.albumoftheyear.org/artist/4490-ariana-grande/","rym":"https://rateyourmusic.com/artist/ariana-grande","RC":"https://www.robertchristgau.com/get_artist.php?name=Ariana+Grande","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["olivia-rodrigo","Olivia Rodrigo","Olivia","聋","#be9cff","36,732,000","53,102,325 followers","3 wins / 14 noms / GF 0/0/0/1","81 / 76",{"grammy":"https://www.grammy.com/search/Olivia%20Rodrigo","aoty":"https://www.albumoftheyear.org/artist/114067-olivia-rodrigo/","rym":"https://rateyourmusic.com/artist/olivia-rodrigo","RC":"https://www.robertchristgau.com/get_artist.php?name=Olivia+Rodrigo","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["sabrina-carpenter","Sabrina Carpenter","Sabrina","三","#ffe1a8","32,093,000","32,012,003 followers","2 wins / 9 noms / GF 0/0/0/0","71 / 66",{"grammy":"https://www.grammy.com/search/Sabrina%20Carpenter","aoty":"https://www.albumoftheyear.org/artist/12237-sabrina-carpenter/","rym":"https://rateyourmusic.com/artist/sabrina-carpenter","RC":"https://www.robertchristgau.com/get_artist.php?name=Sabrina+Carpenter","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["billie-eilish","Billie Eilish","Billie","伦","#a0ff72","77,908,000","126,004,225 followers","10 wins / 34 noms / GF 1/2/3/1","81 / 79",{"grammy":"https://www.grammy.com/search/Billie%20Eilish","aoty":"https://www.albumoftheyear.org/artist/34105-billie-eilish/","rym":"https://rateyourmusic.com/artist/billie-eilish","RC":"https://www.robertchristgau.com/get_artist.php?name=Billie+Eilish","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["dua-lipa","Dua Lipa","Dua","妖","#8de8ff","53,573,000","47,983,375 followers","3 wins / 10 noms / GF 0/0/0/1","70 / 74",{"grammy":"https://www.grammy.com/search/Dua%20Lipa","aoty":"https://www.albumoftheyear.org/artist/20340-dua-lipa/","rym":"https://rateyourmusic.com/artist/dua-lipa","RC":"https://www.robertchristgau.com/get_artist.php?name=Dua+Lipa","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["celine-dion","Celine Dion","Celine","尸","#e8e8e8","203,779,000","11,006,49 followers","56 wins / 1 noms / GF 1/1/0/0","55 / 58",{"grammy":"https://www.grammy.com/search/Celine%20Dion","aoty":"https://www.albumoftheyear.org/artist/4948-celine-dion/","rym":"https://rateyourmusic.com/artist/celine-dion","RC":"https://www.robertchristgau.com/get_artist.php?name=Celine+Dion","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["whitney-houston","Whitney Houston","Whitney","浴缸","#d6f5ff","163,626,000","12,253,552 followers","6 wins / 25 noms / GF 1/1/0/0","63 / 76",{"grammy":"https://www.grammy.com/search/Whitney%20Houston","aoty":"https://www.albumoftheyear.org/artist/4760-whitney-houston/","rym":"https://rateyourmusic.com/artist/whitney-houston","RC":"https://www.robertchristgau.com/get_artist.php?name=Whitney+Houston","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["mariah-carey","Mariah Carey","Mariah","猪咪","#fff0a3","199,930,000","12,825,371 followers","5 wins / 34 noms / GF 0/0/0/1","64 / 77",{"grammy":"https://www.grammy.com/search/Mariah%20Carey","aoty":"https://www.albumoftheyear.org/artist/215-mariah-carey/","rym":"https://rateyourmusic.com/artist/mariah-carey","RC":"https://www.robertchristgau.com/get_artist.php?name=Mariah+Carey","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["charli-xcx","Charli XCX","Charli","茶","#8cff4f","14,370,000","6,993,299 followers","3 wins / 10 noms / GF 0/0/0/0","77 / 80",{"grammy":"https://www.grammy.com/search/Charli%20XCX","aoty":"https://www.albumoftheyear.org/artist/2255-charli-xcx/","rym":"https://rateyourmusic.com/artist/charli-xcx","RC":"https://www.robertchristgau.com/get_artist.php?name=Charli+XCX","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["madonna","Madonna","Madonna","枣","#ffb3c7","257,777,00","9,299,429 followers","7 wins / 28 noms / GF 0/0/0/0","69 / 78",{"grammy":"https://www.grammy.com/search/Madonna","aoty":"https://www.albumoftheyear.org/artist/2269-madonna/","rym":"https://rateyourmusic.com/artist/madonna","RC":"https://www.robertchristgau.com/get_artist.php?name=Madonna","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
  ["nicki-minaj","Nicki Minaj","Nicki","圾","#ff7ac8","64,489,000","34,708,715 followers","0 wins / 12 noms / GF 0/0/0/0","64 / 57",{"grammy":"https://www.grammy.com/search/Nicki%20Minaj","aoty":"https://www.albumoftheyear.org/artist/1375-nicki-minaj/","rym":"https://rateyourmusic.com/artist/nicki-minaj","RC":"https://www.robertchristgau.com/get_artist.php?name=Nicki+Minaj","cmSales":"https://chartmasters.org/best-selling-artists-of-all-time/","cmSpotifyFollowers":"https://chartmasters.org/spotify-most-followed-artists/"}],
];

export const artists: Artist[] = artistRows.map(([
  id,
  name,
  shortName,
  meanName,
  avatarColor,
  sales,
  streaming,
  awards,
  reviews,
  links,
]) => ({
  id,
  name,
  shortName,
  displayNames: {
    mean: meanName,
    neutral: shortName,
  },
  avatarColor,
  avatars: {
    mean: `/assets/artists/mean/${id}-mean.jpg`,
    neutral: `/assets/artists/neutral/${id}-neutral.jpg`,
  },
  stats: {
    sales,
    streaming,
    awards,
    reviews,
  },
  links,
}));
