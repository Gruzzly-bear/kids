/* Views, interaction, and durable sync for the family school dashboard. */
const app = document.getElementById('app');
const sessionKey = 'family-assignment-session-v1';
const THEME_PALETTES = {
  coastal:['Coastal','#005f73','#d7f5f2','#f4fffd','#bdebe5','#77bdb7','#123f46','#365e63'],
  material:['Lavender','#5b35b5','#efe5ff','#fcf9ff','#ded0ff','#b79ceb','#30204e','#62537e'],
  facebook:['Blue','#0d47a1','#e0ecff','#f7faff','#c9dcff','#8eb3f2','#17345e','#405b83'],
  paper:['Warm Paper','#7a3e00','#fff0cc','#fffaf0','#f7dda3','#d7a65b','#4a2c11','#705435'],
  forest:['Forest','#1b5e20','#e6f5d4','#f8fff0','#cdebb4','#91bc76','#213e24','#4e674b'],
  sand:['Coffee','#704214','#fae7c8','#fff9ef','#f0d5ab','#c5a16b','#412a17','#69533a'],
  sunset:['Sunset','#9c2f00','#ffe3c6','#fff8ef','#ffd1a6','#d78c54','#4f281b','#79513c'],
  peach:['Peach','#a52a2a','#ffe2d5','#fff8f5','#ffcdbb','#d28775','#4a2526','#76514f'],
  meadow:['Meadow','#3f6212','#f1f7c9','#fbffed','#e2ed9d','#a6b751','#37411c','#535d2e'],
  berry:['Berry','#9d174d','#fce0ef','#fff7fb','#f8c9de','#d487ac','#4c1f36','#75485f'],
  mint:['Fresh Mint','#00695c','#d7f8e9','#f3fff8','#b6eed1','#70b998','#173e34','#40675a'],
  rose:['Rose','#9f1239','#ffe0e9','#fff7f9','#ffc6d6','#d7869c','#4b1e2d','#744653'],
  citrus:['Citrus','#765500','#fff4a8','#fffce6','#fbe77a','#c8a33d','#493912','#6c5a2a'],
  arctic:['Arctic','#075985','#dcefff','#f4faff','#c0e2ff','#7bafd4','#18384e','#405a68'],
  coral:['Coral','#a82e23','#ffe0d8','#fff7f4','#ffc6b8','#d27f6d','#4d2521','#704740'],
  midnight:['Midnight','#8db8ff','#111b2b'], dark:['Discord Dark','#a4adff','#1e1f25'], dracula:['Dracula','#c4a7ff','#24212e'], electric:['Electric','#ff6bd6','#171023'], aurora:['Aurora','#70e0c3','#122126'], 'plum-glow':['Plum Glow','#e5a4f5','#24152b'],
  'github-dark':['GitHub Dark','#83b8f9','#10151c'], nord:['Nord','#91c9d7','#252f3d'], monokai:['Monokai','#c4d88a','#24251f'],
  oled:['OLED Black','#b9c9ff','#000000'], slate:['Slate','#a9bcd5','#1e2530'], espresso:['Espresso','#e6b98e','#241b18'],
  aubergine:['Aubergine','#dfb1ec','#281e30'], 'ocean-night':['Ocean Night','#83cdda','#11272e'], 'emerald-night':['Emerald Night','#8cd5ad','#15271f'],
  nes:['NES Classic','#c62828','#f3ead8','#fffaf1','#e9dfcb','#b7a98f','#342b24','#655a4f'],
  gameboy:['Game Boy','#536c3c','#b8c99a','#dce8b8','#aab986','#7d8e5a','#25301e','#536143'],
  snes:['Super Nintendo','#6545a5','#ded5ee','#f5f1fa','#cec2e6','#9483b7','#2f2840','#5c546d'],
  genesis:['Sega Genesis','#4ca2ff','#101928'],atari:['Atari 2600','#f2a93b','#20152b'],arcade:['Arcade Cabinet','#ff4fd8','#130c1a'],
  playstation:['PlayStation (PS1)','#2e5bac','#e3e7ee','#f9fafc','#d5dce8','#a5b1c3','#202a3a','#4c5869'],
  ps2:['PlayStation 2','#6f88bd','#111522'],psp:['PSP','#56b4d6','#18242b'],
  gba:['Game Boy Advance','#75519a','#eee5f2','#faf6fb','#e1d4e8','#bca9c5','#33283a','#635568'],
  gbc:['Game Boy Color','#236c6b','#d7e8d2','#f5f8e9','#cadfc1','#8eaf89','#263a34','#526558'],
  n64:['Nintendo 64','#6c4a91','#e8e2ed','#f7f4f9','#d9cfe3','#aa9bb8','#31283a','#5b5263'],
  wii:['Wii','#168da8','#e7f3f6','#fbfeff','#d5e9ee','#a2c7d1','#263a40','#566a70'],
  gamecube:['GameCube','#8270cf','#e8e4f6','#f8f7fd','#d8d2ef','#aaa0d4','#302b42','#605a72'],
  dreamcast:['Dreamcast','#df5b42','#f1e9e3','#fffaf5','#e9d9cf','#cbb7a9','#3a302b','#675a53'],
  xbox:['Xbox Original','#89c541','#101a15'],saturn:['Sega Saturn','#d4d9e2','#e5e8ec','#f8fafc','#d8dce3','#a9b1bf','#252b36','#565f6d'],
  ds:['Nintendo DS','#408fc3','#e3edf7','#f8fbfe','#d3e4f3','#a6bfd5','#273947','#526676'],
  'wow-alliance':['WoW Alliance','#efc84a','#111c27'],
  'wow-horde':['WoW Horde','#df4934','#201416'],
  cuphead:['Cuphead','#b3262e','#f4e8c8','#fff9e8','#ead8aa','#c3a86a','#35251f','#6b5140'],
  'star-wars-sith':['Star Wars Sith','#e33232','#160f14'],
  'star-wars-jedi':['Star Wars Jedi','#4e8a59','#e5ead4','#f7f8e9','#d5ddbd','#a5b587','#26352b','#566653'],
  'star-wars':['Star Wars','#e5b84b','#111827'],
  'swtor':['Star Wars: The Old Republic','#54d7ee','#0b1722'],
  'legend-of-dragoon':['Legend of Dragoon','#9c6029','#ead6a6','#faf0d2','#e2c584','#b98b47','#3d2b20','#70563b'],
  'ps4':['PlayStation 4','#70bcff','#08182f'],
  pipboy:['Fallout Pip-Boy','#78f06a','#06160d'],
  sims:['The Sims','#168aca','#dff4fc','#f8fdff','#c9eaf6','#93cde0','#19394a','#526d78'],
  'stardew-valley':['Stardew Valley','#a95b16','#edd8a3','#fff1ce','#e7c783','#c09142','#482c1c','#71523a'],
  'binding-of-isaac':['The Binding of Isaac','#8e542f','#f2e0b5','#fbf2d7','#e4c98b','#c09d5f','#3e2927','#72584a'],
  book:['Book','#725737','#eee3cc','#f8f1e3','#e8dcc2','#cbb992','#332a20','#665846'],
  'sepia-story':['Sepia Story','#7a4d2b','#e9d7b8','#f4e8d2','#dec6a2','#b8996e','#38291c','#685542'],
  'comic-book':['Comic Book','#c62828','#fff2a8','#fffbe0','#f8df68','#d3a72c','#332514','#665533'],
  'pastel-pop':['Pastel Pop','#8b5cf6','#f1e9ff','#fcf9ff','#e5d7ff','#b9a0e8','#352450','#635478'],
  'sakura-paper':['Sakura Paper','#b83262','#f8e7e7','#fff8f5','#f1d5d8','#d7a5ac','#452a30','#76575c'],
  chalkboard:['Chalkboard','#b5e6a4','#14271f'],
  'arcade-cyan':['Arcade Cyan','#48f0e0','#101d2b'],
  'space-cadet':['Space Cadet','#87aaff','#101727'],
  contrast:['High Contrast','#173fb0','#ffffff'], 'contrast-dark':['High Contrast Dark','#ffe36b','#000000']
};
const THEME_BACKDROPS={
  ps2:'radial-gradient(ellipse at 50% 48%,transparent 0 18%,color-mix(in srgb,var(--accent) 24%,transparent) 19% 20%,transparent 21% 38%),repeating-conic-gradient(from 0deg at 50% 48%,color-mix(in srgb,var(--accent) 38%,transparent) 0deg 1deg,transparent 1deg 30deg),radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--accent) 58%,transparent),transparent 72%)',
  arcade:'repeating-linear-gradient(0deg,transparent 0 5px,color-mix(in srgb,var(--accent) 20%,transparent) 5px 6px),linear-gradient(90deg,transparent 49.8%,color-mix(in srgb,var(--accent) 18%,transparent) 50%,transparent 50.2%),radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent) 42%,transparent),transparent 74%)',
  'arcade-cyan':'repeating-linear-gradient(0deg,transparent 0 5px,color-mix(in srgb,var(--accent) 18%,transparent) 5px 6px),radial-gradient(ellipse at 50% 48%,color-mix(in srgb,var(--accent) 42%,transparent),transparent 72%)',
  'binding-of-isaac':'radial-gradient(ellipse at 50% 45%,color-mix(in srgb,#aaa 19%,transparent),transparent 68%),radial-gradient(color-mix(in srgb,#777 15%,transparent) .6px,transparent .9px)',
  'stardew-valley':'linear-gradient(176deg,transparent 0 56%,color-mix(in srgb,#456b32 28%,transparent) 56.5% 64%,transparent 64.5%),linear-gradient(164deg,transparent 0 70%,color-mix(in srgb,#6d913c 28%,transparent) 70.5% 77%,transparent 77.5%),repeating-linear-gradient(90deg,transparent 0 28px,color-mix(in srgb,var(--accent) 10%,transparent) 28px 30px),radial-gradient(ellipse at 50% 16%,color-mix(in srgb,#9dc6df 24%,transparent),transparent 70%)',
  'legend-of-dragoon':'radial-gradient(ellipse at 50% 35%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 72%),repeating-linear-gradient(0deg,transparent 0 22px,color-mix(in srgb,var(--accent) 8%,transparent) 22px 23px)',
  'wow-alliance':'linear-gradient(135deg,transparent 0 47%,color-mix(in srgb,var(--accent) 25%,transparent) 48% 49%,transparent 50%),linear-gradient(45deg,color-mix(in srgb,#52677a 22%,transparent),transparent 45%,color-mix(in srgb,#c4ccd4 18%,transparent))',
  'wow-horde':'linear-gradient(135deg,transparent 0 47%,color-mix(in srgb,var(--accent) 24%,transparent) 48% 49%,transparent 50%),linear-gradient(45deg,color-mix(in srgb,#55302a 26%,transparent),transparent 45%,color-mix(in srgb,#c0a391 16%,transparent))',
  'star-wars':'radial-gradient(circle at 18% 22%,color-mix(in srgb,var(--accent) 65%,transparent) 0 1px,transparent 2px),radial-gradient(circle at 78% 36%,color-mix(in srgb,var(--accent) 55%,transparent) 0 1px,transparent 2px),radial-gradient(circle at 58% 78%,color-mix(in srgb,var(--accent) 48%,transparent) 0 1px,transparent 2px),radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 70%)',
  'star-wars-sith':'radial-gradient(circle at 78% 25%,color-mix(in srgb,var(--accent) 62%,transparent) 0 1px,transparent 2px),radial-gradient(circle at 22% 68%,color-mix(in srgb,var(--accent) 50%,transparent) 0 1px,transparent 2px),radial-gradient(ellipse at 78% 32%,color-mix(in srgb,var(--accent) 34%,transparent),transparent 55%)',
  'star-wars-jedi':'radial-gradient(circle at 18% 28%,color-mix(in srgb,var(--accent) 60%,transparent) 0 1px,transparent 2px),radial-gradient(circle at 76% 72%,color-mix(in srgb,var(--accent) 50%,transparent) 0 1px,transparent 2px),radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 70%)',
  swtor:'linear-gradient(125deg,transparent 0 30%,color-mix(in srgb,var(--accent) 30%,transparent) 30.2% 30.5%,transparent 30.7% 70%,color-mix(in srgb,var(--accent) 22%,transparent) 70.2% 70.5%,transparent 70.7%),radial-gradient(ellipse at 80% 20%,color-mix(in srgb,var(--accent) 36%,transparent),transparent 64%)',
  ps4:'radial-gradient(ellipse at 18% 18%,color-mix(in srgb,var(--accent) 48%,transparent),transparent 34%),radial-gradient(ellipse at 78% 72%,color-mix(in srgb,var(--accent) 30%,transparent),transparent 42%),linear-gradient(145deg,transparent 44%,color-mix(in srgb,var(--accent) 16%,transparent) 45% 49%,transparent 50%)',
  pipboy:'repeating-linear-gradient(0deg,transparent 0 4px,color-mix(in srgb,var(--accent) 22%,transparent) 4px 5px),linear-gradient(90deg,transparent 49%,color-mix(in srgb,var(--accent) 12%,transparent) 50%,transparent 51%)',
  nes:'repeating-linear-gradient(90deg,transparent 0 30px,color-mix(in srgb,var(--accent) 11%,transparent) 30px 32px),linear-gradient(0deg,color-mix(in srgb,var(--accent) 14%,transparent),transparent 58%)',
  gameboy:'repeating-linear-gradient(0deg,transparent 0 15px,color-mix(in srgb,var(--accent) 10%,transparent) 15px 16px),repeating-linear-gradient(90deg,transparent 0 15px,color-mix(in srgb,var(--accent) 10%,transparent) 15px 16px)',
  gba:'repeating-linear-gradient(0deg,transparent 0 18px,color-mix(in srgb,var(--accent) 9%,transparent) 18px 20px),radial-gradient(ellipse at 50% 30%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 72%)',
  gbc:'repeating-linear-gradient(90deg,transparent 0 22px,color-mix(in srgb,var(--accent) 10%,transparent) 22px 23px),radial-gradient(ellipse at 50% 20%,color-mix(in srgb,var(--accent) 19%,transparent),transparent 72%)',
  n64:'radial-gradient(circle at 22% 28%,color-mix(in srgb,#e74836 22%,transparent) 0 9%,transparent 9.5%),radial-gradient(circle at 70% 72%,color-mix(in srgb,#47a9e7 22%,transparent) 0 12%,transparent 12.5%),radial-gradient(ellipse at 50% 48%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 72%)',
  dreamcast:'radial-gradient(circle at 82% 20%,color-mix(in srgb,var(--accent) 32%,transparent) 0 12%,transparent 12.5%),linear-gradient(155deg,transparent 44%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 70%)',
  sims:'radial-gradient(ellipse at 50% 18%,color-mix(in srgb,var(--accent) 25%,transparent),transparent 28%),radial-gradient(ellipse at 50% 80%,color-mix(in srgb,#65a94d 20%,transparent),transparent 45%)',
  cuphead:'radial-gradient(color-mix(in srgb,var(--accent) 14%,transparent) .7px,transparent 1px),radial-gradient(ellipse at 50% 35%,color-mix(in srgb,#d5b77f 18%,transparent),transparent 68%)',
  book:'radial-gradient(color-mix(in srgb,var(--accent) 11%,transparent) .6px,transparent .9px),linear-gradient(135deg,transparent,color-mix(in srgb,var(--accent) 9%,transparent))',
  paper:'radial-gradient(color-mix(in srgb,var(--accent) 11%,transparent) .6px,transparent .9px),linear-gradient(135deg,transparent,color-mix(in srgb,var(--accent) 8%,transparent))',
  coastal:'radial-gradient(ellipse at 15% 90%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 48%),linear-gradient(165deg,transparent 64%,color-mix(in srgb,var(--accent) 12%,transparent) 65% 69%,transparent 70%)',
  material:'radial-gradient(circle at 78% 18%,color-mix(in srgb,var(--accent) 18%,transparent) 0 13%,transparent 13.5%),radial-gradient(circle at 18% 82%,color-mix(in srgb,var(--accent) 14%,transparent) 0 18%,transparent 18.5%)',
  facebook:'linear-gradient(145deg,transparent 0 48%,color-mix(in srgb,var(--accent) 16%,transparent) 49% 50%,transparent 51%),radial-gradient(ellipse at 10% 10%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 58%)',
  forest:'radial-gradient(ellipse at 12% 100%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 45%),radial-gradient(ellipse at 88% 100%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 40%),linear-gradient(180deg,transparent 55%,color-mix(in srgb,var(--accent) 8%,transparent))',
  meadow:'linear-gradient(170deg,transparent 0 58%,color-mix(in srgb,var(--accent) 18%,transparent) 58.5% 69%,transparent 69.5%),linear-gradient(15deg,transparent 0 68%,color-mix(in srgb,var(--accent) 12%,transparent) 68.5% 78%,transparent 78.5%)',
  mint:'radial-gradient(ellipse at 80% 20%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 44%),radial-gradient(ellipse at 18% 76%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 38%)',
  'ocean-night':'radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--accent) 28%,transparent),transparent 58%),linear-gradient(180deg,transparent 60%,color-mix(in srgb,var(--accent) 10%,transparent))',
  'emerald-night':'radial-gradient(ellipse at 75% 20%,color-mix(in srgb,var(--accent) 25%,transparent),transparent 46%),radial-gradient(ellipse at 12% 86%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 42%)',
  sunset:'linear-gradient(180deg,color-mix(in srgb,var(--accent) 15%,transparent),transparent 55%),radial-gradient(ellipse at 50% 100%,color-mix(in srgb,#e7a44c 18%,transparent),transparent 45%)',
  peach:'radial-gradient(ellipse at 12% 18%,color-mix(in srgb,var(--accent) 19%,transparent),transparent 44%),radial-gradient(ellipse at 88% 85%,color-mix(in srgb,#e9a578 18%,transparent),transparent 46%)',
  berry:'radial-gradient(circle at 82% 25%,color-mix(in srgb,var(--accent) 19%,transparent) 0 10%,transparent 10.5%),radial-gradient(circle at 18% 78%,color-mix(in srgb,var(--accent) 14%,transparent) 0 15%,transparent 15.5%)',
  rose:'radial-gradient(ellipse at 15% 85%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 48%),radial-gradient(ellipse at 85% 20%,color-mix(in srgb,var(--accent) 12%,transparent),transparent 42%)',
  citrus:'radial-gradient(circle at 82% 20%,color-mix(in srgb,var(--accent) 18%,transparent) 0 12%,transparent 12.5%),radial-gradient(circle at 18% 78%,color-mix(in srgb,var(--accent) 12%,transparent) 0 16%,transparent 16.5%)',
  arctic:'linear-gradient(145deg,transparent 40%,color-mix(in srgb,var(--accent) 14%,transparent) 41% 42%,transparent 43%),radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 60%)',
  coral:'radial-gradient(ellipse at 80% 90%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 46%),radial-gradient(ellipse at 14% 10%,color-mix(in srgb,#f5a68d 18%,transparent),transparent 42%)',
  snes:'linear-gradient(135deg,transparent 0 35%,color-mix(in srgb,var(--accent) 15%,transparent) 35.5% 36.5%,transparent 37%),radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent) 17%,transparent),transparent 72%)',
  genesis:'repeating-linear-gradient(0deg,transparent 0 26px,color-mix(in srgb,var(--accent) 12%,transparent) 26px 28px),linear-gradient(120deg,transparent,color-mix(in srgb,var(--accent) 18%,transparent))',
  atari:'repeating-linear-gradient(0deg,transparent 0 24px,color-mix(in srgb,var(--accent) 16%,transparent) 24px 26px),linear-gradient(180deg,transparent 40%,color-mix(in srgb,var(--accent) 13%,transparent))',
  playstation:'radial-gradient(circle at 50% 50%,transparent 0 16%,color-mix(in srgb,var(--accent) 18%,transparent) 16.5% 17%,transparent 17.5% 33%,color-mix(in srgb,var(--accent) 12%,transparent) 33.5% 34%,transparent 34.5%),radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 72%)',
  psp:'radial-gradient(ellipse at 60% 15%,color-mix(in srgb,var(--accent) 26%,transparent),transparent 45%),repeating-linear-gradient(155deg,transparent 0 32px,color-mix(in srgb,var(--accent) 10%,transparent) 33px 34px)',
  wii:'radial-gradient(circle at 50% 42%,transparent 0 16%,color-mix(in srgb,var(--accent) 20%,transparent) 16.5% 17.5%,transparent 18% 30%,color-mix(in srgb,var(--accent) 13%,transparent) 30.5% 31.5%,transparent 32%)',
  gamecube:'conic-gradient(from 30deg at 50% 45%,transparent 0 16%,color-mix(in srgb,var(--accent) 16%,transparent) 16.5% 17%,transparent 17.5% 50%),radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 70%)',
  saturn:'radial-gradient(circle at 50% 48%,transparent 0 22%,color-mix(in srgb,var(--accent) 22%,transparent) 22.5% 23%,transparent 23.5% 38%,color-mix(in srgb,var(--accent) 13%,transparent) 38.5% 39%,transparent 39.5%)',
  ds:'linear-gradient(180deg,transparent 0 48%,color-mix(in srgb,var(--accent) 18%,transparent) 49% 50%,transparent 51%),radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent) 14%,transparent),transparent 68%)',
  xbox:'radial-gradient(circle at 50% 48%,transparent 0 18%,color-mix(in srgb,var(--accent) 27%,transparent) 19% 20%,transparent 21% 42%),radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent) 24%,transparent),transparent 70%)',
  'pastel-pop':'radial-gradient(circle at 20% 22%,color-mix(in srgb,var(--accent) 17%,transparent) 0 10%,transparent 10.5%),radial-gradient(circle at 82% 78%,color-mix(in srgb,var(--accent) 14%,transparent) 0 15%,transparent 15.5%)',
  'sakura-paper':'radial-gradient(circle at 20% 20%,color-mix(in srgb,var(--accent) 15%,transparent) 0 2px,transparent 2.5px),radial-gradient(circle at 78% 72%,color-mix(in srgb,var(--accent) 12%,transparent) 0 3px,transparent 3.5px)',
  'comic-book':'radial-gradient(color-mix(in srgb,var(--accent) 14%,transparent) 1px,transparent 1.5px)',
  chalkboard:'repeating-linear-gradient(0deg,transparent 0 32px,color-mix(in srgb,var(--accent) 9%,transparent) 32px 33px),radial-gradient(ellipse at 50% 30%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 68%)',
  'space-cadet':'radial-gradient(circle at 18% 20%,color-mix(in srgb,var(--accent) 65%,transparent) 0 1px,transparent 2px),radial-gradient(circle at 82% 55%,color-mix(in srgb,var(--accent) 50%,transparent) 0 1px,transparent 2px),radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 70%)'
};
const BACKGROUND_EFFECTS={
  none:{image:'none',size:'auto',repeat:'no-repeat'},
  scanlines:{image:'repeating-linear-gradient(0deg,color-mix(in srgb,var(--ink) 34%,transparent) 0 1px,transparent 1px 4px)',size:'100% 4px',repeat:'repeat'},
  grid:{image:'linear-gradient(color-mix(in srgb,var(--ink) 28%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--ink) 28%,transparent) 1px,transparent 1px)',size:'18px 18px,18px 18px',repeat:'repeat,repeat'},
  paper:{image:'radial-gradient(color-mix(in srgb,var(--ink) 27%,transparent) .55px,transparent .85px)',size:'7px 7px',repeat:'repeat'},
  halftone:{image:'radial-gradient(color-mix(in srgb,var(--ink) 34%,transparent) .8px,transparent 1.2px)',size:'8px 8px',repeat:'repeat'}
};
const DARK_THEME_KEYS = ['midnight','dark','dracula','electric','aurora','plum-glow','github-dark','nord','monokai','oled','slate','espresso','aubergine','ocean-night','emerald-night','genesis','atari','arcade','chalkboard','arcade-cyan','space-cadet','ps2','psp','xbox','wow-alliance','wow-horde','star-wars-sith','star-wars','swtor','ps4','pipboy','contrast-dark'];
const THEME_FONT_MATCHES = {
  coastal:'montserrat',material:'queensides',facebook:'montserrat',forest:'super-joyful',meadow:'super-joyful',mint:'montserrat',arctic:'montserrat',
  nes:'spenbeb-game',gameboy:'ci-gamedev',snes:'ballkids-game',genesis:'retro-viber',atari:'money-game',arcade:'spenbeb-game',
  playstation:'emotion-engine',ps2:'emotion-engine',psp:'emotion-engine',ps4:'montserrat',gba:'gamepixies',gbc:'ci-gamedev',n64:'ballkids-game',wii:'montserrat',gamecube:'ballkids-game',dreamcast:'queensides',xbox:'fokuz',saturn:'emotion-engine',ds:'gamepixies',
  'wow-alliance':'bravyka','wow-horde':'midnight',cuphead:'super-joyful','star-wars-sith':'midnight','star-wars-jedi':'queensides','star-wars':'queensides',swtor:'fokuz','legend-of-dragoon':'dragoon-bold',sims:'gamepixies','stardew-valley':'baby-angel','binding-of-isaac':'simple-people',pipboy:'tbj-margin',
  'comic-book':'retro-viber','pastel-pop':'super-joyful','sakura-paper':'soffie','sepia-story':'bravyka',chalkboard:'montserrat','arcade-cyan':'ci-gamedev','space-cadet':'queensides', 'ocean-night':'fokuz','emerald-night':'wah-iki'
};
const EXTRA_FONT_OPTIONS = [['baby-angel','Baby Angel'],['ballkids-game','Ballkids Game'],['bravyka','Bravyka'],['ci-gamedev','CI Gamedev 16px'],['fokuz','Fokuz'],['gamepixies','Gamepixies'],['midnight','Midnight'],['money-game','Money Game'],['montserrat','Montserrat'],['queensides','Queensides'],['retro-viber','Retro Viber'],['rushford-clean','Rushford Clean'],['simple-people','Simple People'],['soffie','Soffie'],['spenbeb-game','Spenbeb Game'],['super-joyful','Super Joyful'],['tbj-margin','TBJ Margin'],['wah-iki','Wah Iki']];
const FONT_STYLE_IDS = ['theme','charger','cosmic-fantasy','dalelands','dragoon-bold','emotion-engine','gamecuben','gbboot','isaacsans','kroegbainder','modern-fantasy','pokemon-gb','warioland4',...EXTRA_FONT_OPTIONS.map(([id])=>id)];
const READABLE_FONT_IDS = ['theme','montserrat','queensides','charger','emotion-engine','isaacsans','rushford-clean','tbj-margin'];
const PROFILE_AVATARS = ['default','🐱','🐶','🦊','🐼','🐸','🦄','🐉','🐢','🦋','🐙','🦖','🐧','🐨','🐺','🦁','🐯','🐰','🐹','🐝','🦉','🚀','⚡','🤖','👾','🎮','🎨','🦈','🐬','🦕','🧙','🥷'];
const AVATAR_FRAMES = [['circle','Circle'],['rounded','Rounded'],['double','Double ring'],['glow','Glow'],['sticker','Sticker'],['none','No frame']];
const DEFAULT_PREFS = {appearance:'system',lightTheme:'coastal',darkTheme:'midnight',visualStyle:'classic',dashboardExpanded:false,decorativeFonts:false,fontStyle:'theme',clockFont:'theme',cornerStyle:'theme',edgeStyle:'theme',surfaceTexture:'none',backgroundImage:'',backgroundOpacity:16,backgroundEffect:'none',textSize:'standard',density:'comfortable',clockFormat:'12h',motion:'system',classBrowser:false,hideCompleted:true,avatar:'default',avatarImage:'',avatarFrame:'circle'};
state.preferences = {};
state.parentTab = 'overview';
state.pending = [];
state.syncPhase = 'saved';
state.syncError = '';
state.liveSyncError = '';
let pumping = false;
let pumpPromise = null;
let undoAction = null;

function localRead(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function localWrite(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* UI remains usable when storage is unavailable. */ } }
function scope() { return state.view || 'home'; }
function prefs(forScope = scope()) {
  const local = localRead('school-preferences-'+forScope, {});
  const oldTheme=localStorage.getItem('family-assignment-theme'),legacy=THEME_PALETTES[oldTheme]?{appearance:DARK_THEME_KEYS.includes(oldTheme)?'dark':'light',...(DARK_THEME_KEYS.includes(oldTheme)?{darkTheme:oldTheme}:{lightTheme:oldTheme})}:{};
  const p = forScope==='monitor'||forScope==='home'?{...DEFAULT_PREFS,...legacy,...state.preferences[forScope],...local}:{...DEFAULT_PREFS,...legacy,...local,...state.preferences[forScope]};
  if (!THEME_PALETTES[p.lightTheme] || DARK_THEME_KEYS.includes(p.lightTheme)) p.lightTheme='coastal';
  if (!DARK_THEME_KEYS.includes(p.darkTheme)) p.darkTheme='midnight';
  if(!themeOwned(p.lightTheme,forScope))p.lightTheme='coastal';
  if(!themeOwned(p.darkTheme,forScope))p.darkTheme='midnight';
  if (!['classic','boxy','studio','playful','glass','minimal','comic','retro','pixel','book','stardew','dragoon','wow-ui','isaac','swtor','ps2-ui','ps4-ui','pipboy'].includes(p.visualStyle)) p.visualStyle='classic';
  if (!FONT_STYLE_IDS.includes(p.fontStyle)) p.fontStyle='theme';
  if (!['theme','soft','square','pill'].includes(p.cornerStyle)) p.cornerStyle='theme';
  if (!['theme','plain','outlined','bold','dashed','glow'].includes(p.edgeStyle)) p.edgeStyle='theme';
  if (!['none','paper','grid','scanlines','halftone'].includes(p.surfaceTexture)) p.surfaceTexture='none';
  if (typeof p.backgroundImage!=='string'||!/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(p.backgroundImage)||p.backgroundImage.length>450000) p.backgroundImage='';
  p.backgroundOpacity=Number.isFinite(Number(p.backgroundOpacity))?Math.max(0,Math.min(35,Math.round(Number(p.backgroundOpacity)))):16;
  if (!Object.hasOwn(BACKGROUND_EFFECTS,p.backgroundEffect)) p.backgroundEffect='none';
  if (!['system','light','dark'].includes(p.appearance)) p.appearance='system';
  if (!['standard','large','small','extra-large'].includes(p.textSize)) p.textSize='standard';
  if (!['comfortable','compact'].includes(p.density)) p.density='comfortable';
  if (!['12h','24h'].includes(p.clockFormat)) p.clockFormat='12h';
  if (!['system','reduced','full'].includes(p.motion)) p.motion='system';
  if (!['theme','system',...FONT_STYLE_IDS.filter(font=>'theme'!==font)].includes(p.clockFont)) p.clockFont='theme';
  if (!PROFILE_AVATARS.includes(p.avatar)) p.avatar='default';
  if (typeof p.avatarImage!=='string'||!/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(p.avatarImage)||p.avatarImage.length>120000) p.avatarImage='';
  if (!AVATAR_FRAMES.some(([frame])=>frame===p.avatarFrame)) p.avatarFrame='circle';
  p.allowedFonts=Array.isArray(p.allowedFonts)?p.allowedFonts.filter(id=>FONT_STYLE_IDS.includes(id)&&id!=='theme'):(p.decorativeFonts===true?FONT_STYLE_IDS.filter(id=>id!=='theme'):READABLE_FONT_IDS.filter(id=>id!=='theme'));
  p.decorativeFonts=p.allowedFonts.some(id=>!READABLE_FONT_IDS.includes(id));
  if(p.fontStyle!=='theme'&&!p.allowedFonts.includes(p.fontStyle))p.fontStyle='theme';
  if(!['theme','system'].includes(p.clockFont)&&!p.allowedFonts.includes(p.clockFont))p.clockFont='theme';
  for(const [field,rule] of Object.entries(state.rewards?.cosmeticRules||{}))if(!cosmeticOwned(field,p[field],forScope))p[field]=rule.default;
  return p;
}
function cosmeticItem(field,value){const rule=state.rewards?.cosmeticRules?.[field];if(!rule)return null;const normalized=['avatarImage','backgroundImage'].includes(field)?(value?'custom':''):value;return Object.values(state.rewards?.cosmetics||{}).find(item=>item.group===rule.group&&item.value===normalized)||null;}
function cosmeticOwned(field,value,student=state.settingsScope||scope()){
  if(!['leon','logan'].includes(student))return true;
  const rule=state.rewards?.cosmeticRules?.[field];if(!rule)return true;
  if(value===rule.default)return true;
  const item=cosmeticItem(field,value);return !!item&&!!state.rewards?.cosmeticUnlocks?.[student]?.includes(item.id);
}
async function openCosmeticUnlock(field,value,student){
  const item=cosmeticItem(field,value);if(!item)return;
  if(state.auth?.role!==student){showToast('Sign in as '+nameOf(student)+' to buy this unlock.');return;}
  if(!await pumpWrites()){showToast('Save your pending changes first.');return;}
  try{state.rewards=(await fetchAuth(state.auth)).rewards;}catch{showToast('Connect to load your point balance.');return;}
  if(cosmeticOwned(field,value,student)){drawSettings();return;}
  const balance=state.rewards.balances[student]||0;
  openDialog('unlock-cosmetic',`<h2>Unlock ${esc(item.title)}</h2><p>${item.cost} points · A permanent unlock for ${nameOf(student)}.</p><p>You have ${balance} points.</p><div class="actions"><button class="button" ${balance<item.cost?'disabled':''} onclick="storeAction({rewardAction:'unlockCosmetic',id:${jsArg(item.id)}})">Unlock for ${item.cost} points</button><button class="button light" onclick="drawSettings()">Back to settings</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
function labelCosmeticPrices(){
  const student=state.settingsScope;if(!['leon','logan'].includes(student))return;
  document.querySelectorAll('#app-dialog select[data-pref]').forEach(select=>{
    const field=select.dataset.pref;if(!state.rewards?.cosmeticRules?.[field])return;
    for(const option of select.options){const item=cosmeticItem(field,option.value);if(item)option.textContent+=cosmeticOwned(field,option.value,student)?' · Unlocked':` · 🔒 ${item.cost} points`;}
  });
  document.querySelectorAll('[data-avatar-choice]').forEach(button=>{const value=button.dataset.avatarChoice,item=cosmeticItem('avatar',value);if(item&&!cosmeticOwned('avatar',value,student))button.insertAdjacentHTML('beforeend',`<small>🔒 ${item.cost} pts</small>`);});
  document.querySelectorAll('[data-avatar-frame-choice]').forEach(button=>{const value=button.dataset.avatarFrameChoice,item=cosmeticItem('avatarFrame',value);if(item&&!cosmeticOwned('avatarFrame',value,student))button.insertAdjacentHTML('beforeend',`<small>🔒 ${item.cost} pts</small>`);});
  for(const [field,handler] of [['avatarImage','setProfileAvatarImage'],['backgroundImage','setCustomBackground']]){
    const input=document.querySelector(`#app-dialog input[type="file"][onchange*="${handler}"]`),item=cosmeticItem(field,'custom');
    if(input&&item&&!cosmeticOwned(field,'custom',student)){input.hidden=true;input.insertAdjacentHTML('afterend',`<button type="button" class="button light" onclick="event.preventDefault();openCosmeticUnlock('${field}','custom',state.settingsScope)">🔒 Unlock uploads · ${item.cost} points</button>`);}
  }
}
function themeOwned(theme,student=state.settingsScope||scope()){return !['leon','logan'].includes(student)||['coastal','midnight',...(state.rewards?.unlocked?.[student]||[])].includes(theme);}
function themeLockLabel(theme){return themeOwned(theme)?(['coastal','midnight'].includes(theme)?'Free':'Unlocked'):'🔒 5 points';}
function activeTheme(p){const dark=p.appearance==='dark'||p.appearance==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;return dark?p.darkTheme:p.lightTheme;}
function applyPreferences() {
  const p=prefs(), dark=p.appearance==='dark'||p.appearance==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;
  const theme=dark?p.darkTheme:p.lightTheme, palette=THEME_PALETTES[theme], root=document.documentElement;
  root.dataset.theme=theme; root.dataset.mode=dark?'dark':'light'; root.dataset.style=p.visualStyle;const matchedFont=p.fontStyle==='theme'?(THEME_FONT_MATCHES[theme]||'montserrat'):p.fontStyle;root.dataset.font=p.allowedFonts.includes(matchedFont)?matchedFont:'theme';root.dataset.clockFont=p.clockFont; root.dataset.corners=p.cornerStyle;root.dataset.edges=p.edgeStyle;root.dataset.texture=p.surfaceTexture;root.dataset.size=p.textSize; root.dataset.density=p.density;root.dataset.motion=p.motion;
  let fontLibrary=document.getElementById('decorative-font-library');
  if(p.decorativeFonts&&!fontLibrary){fontLibrary=document.createElement('link');fontLibrary.id='decorative-font-library';fontLibrary.rel='stylesheet';fontLibrary.href='assets/optional-fonts/fonts.css';document.head.append(fontLibrary);}
  if(!p.decorativeFonts&&fontLibrary)fontLibrary.remove();
  root.dataset.contrast=theme.startsWith('contrast')?'high':'normal';
  root.style.setProperty('--theme-backdrop',THEME_BACKDROPS[theme]||'radial-gradient(ellipse at 50% 8%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 72%)');
  root.style.setProperty('--custom-background-image',p.backgroundImage?`url("${p.backgroundImage}")`:'none');
  root.style.setProperty('--custom-background-opacity',p.backgroundImage?String(p.backgroundOpacity/100):'0');
  const backgroundEffect=BACKGROUND_EFFECTS[p.backgroundEffect]||BACKGROUND_EFFECTS.none;
  root.style.setProperty('--custom-background-effect',backgroundEffect.image);
  root.style.setProperty('--custom-background-effect-size',backgroundEffect.size);
  root.style.setProperty('--custom-background-effect-repeat',backgroundEffect.repeat);
  root.style.setProperty('--accent',palette[1]); root.style.setProperty('--page',palette[2]);
  root.style.setProperty('--on-accent',dark?'var(--page)':'#ffffff');
  const lightTokens=['--surface','--surface-2','--line','--ink','--muted'];
  if(dark||theme==='contrast')lightTokens.forEach(token=>root.style.removeProperty(token));
  else ['--surface','--surface-2','--line','--ink','--muted'].forEach((token,index)=>root.style.setProperty(token,palette[index+3]));
  document.querySelector('meta[name="theme-color"]').content=palette[2];
}
function previewCustomBackgroundOpacity(value,forScope=scope()){
  if(forScope!==scope())return;
  const opacity=Math.max(0,Math.min(35,Number(value)||0));document.documentElement.style.setProperty('--custom-background-opacity',String(opacity/100));
  const output=document.querySelector('[data-background-opacity-value]');if(output)output.textContent=`${opacity}%`;
}
async function setProfileAvatarImage(input,forScope=state.settingsScope||scope()){
  if(!cosmeticOwned('avatarImage','custom',forScope)){input.value='';openCosmeticUnlock('avatarImage','custom',forScope);return;}
  const file=input.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')){showToast('Choose an image file.');input.value='';return;}
  try{
    const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),context=canvas.getContext('2d');
    if(!context)throw new Error('Image editing is unavailable in this browser.');
    let scale=Math.min(1,256/Math.max(bitmap.width,bitmap.height)),data='';
    for(let attempt=0;attempt<10;attempt++){
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      data=canvas.toDataURL('image/webp',Math.max(.3,.86-attempt*.07));if(data.startsWith('data:image/webp;base64,')&&data.length<=120000)break;
      if(attempt>3)scale*=.8;
    }
    bitmap.close?.();if(!data.startsWith('data:image/webp;base64,')||data.length>120000)throw new Error('That picture could not be reduced enough. Try a smaller image.');
    setPreference('avatarImage',data,forScope);showToast(`${nameOf(forScope)}’s picture saved.`);
  }catch(error){console.error('Could not save profile picture:',error);showToast(error.message||'Could not load that picture.');}
  input.value='';
}
function clearProfileAvatarImage(forScope=state.settingsScope||scope()){setPreference('avatarImage','',forScope);showToast('Profile picture removed.');}
async function setCustomBackground(input){
  if(!cosmeticOwned('backgroundImage','custom',state.settingsScope)){input.value='';openCosmeticUnlock('backgroundImage','custom',state.settingsScope);return;}
  const file=input.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')){showToast('Choose an image file.');input.value='';return;}
  try{
    const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),context=canvas.getContext('2d');
    if(!context)throw new Error('Image editing is unavailable in this browser.');
    let scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height)),data='';
    for(let attempt=0;attempt<7;attempt++){
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      data=canvas.toDataURL('image/webp',Math.max(.48,.82-attempt*.06));if(data.startsWith('data:image/webp;base64,')&&data.length<=450000)break;
      scale*=.82;
    }
    bitmap.close?.();if(!data.startsWith('data:image/webp;base64,')||data.length>450000)throw new Error('That image could not be reduced enough. Try a smaller image.');
    setPreference('backgroundImage',data,state.settingsScope);showToast('Custom background saved.');
  }catch(error){console.error('Could not save custom background:',error);showToast(error.message||'Could not load that image.');}
  input.value='';
}
function clearCustomBackground(forScope=scope()){setPreference('backgroundImage','',forScope);}
function setPreference(field, value, forScope=scope()) {
  if(!cosmeticOwned(field,value,forScope)){openCosmeticUnlock(field,value,forScope);return;}
  if(['decorativeFonts','allowedFonts','dashboardExpanded'].includes(field)&&state.auth?.role!=='parent')return;
  if(['lightTheme','darkTheme'].includes(field)&&!themeOwned(value,forScope)){openThemeUnlock(value,forScope);return;}
  const p={...prefs(forScope),[field]:value};
  if(field==='avatar')p.avatarImage='';
  state.preferences[forScope]=p; localWrite('school-preferences-'+forScope,p);
  if(forScope===scope())applyPreferences();
  if(state.auth&&state.auth.role!=='monitor')queuedWrite({preferencesOnly:true,scope:forScope,preferences:p},'Preferences');
  if(field==='classBrowser'||field==='hideCompleted'||field==='clockFormat'||field==='dashboardExpanded')render();
  updateAppearanceControls(p);
  if(['leon','logan'].includes(forScope)&&['avatar','avatarImage','avatarFrame'].includes(field))refreshProfileAvatarViews(forScope,p);
}
function selectTheme(theme,forScope=scope()){
  if(!THEME_PALETTES[theme])return;
  if(!themeOwned(theme,forScope)){openThemeUnlock(theme,forScope);return;}
  const dark=DARK_THEME_KEYS.includes(theme),p={...prefs(forScope),appearance:dark?'dark':'light',[dark?'darkTheme':'lightTheme']:theme};
  state.preferences[forScope]=p;localWrite('school-preferences-'+forScope,p);
  if(forScope===scope())applyPreferences();
  if(state.auth&&state.auth.role!=='monitor')queuedWrite({preferencesOnly:true,scope:forScope,preferences:p},'Preferences');
  updateAppearanceControls(p);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyPreferences());
function schoolDay(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function scheduleDay(){return schoolDay();}
function cleanScheduledDays(days){const keepFrom=schoolMinutes()>=780?scheduleDay():addDays(scheduleDay(),-1);return Object.fromEntries(Object.entries(days||{}).filter(([date])=>date>=keepFrom).map(([date,items])=>[date,copySchedule(items)]));}
function scheduleFor(student,date=scheduleDay()){
  if(Object.hasOwn(state.scheduledDays[student]||{},date))return copySchedule(state.scheduledDays[student][date]);
  return [];
}
function schoolMinutes(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return +parts.hour*60 + +parts.minute;
}
function addDays(date,count){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function dateLabel(date, weekday=true){return date?new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',...(weekday?{weekday:'long'}:{}),month:'short',day:'numeric'}):'No due date';}
function nameOf(student){return student==='leon'?'Leon':student==='logan'?'Logan':'Family';}
function iconOf(student){return student==='leon'?'🚀':'⚡';}
function profileAvatarFor(student,profile=prefs(student)){return profile.avatar==='default'?iconOf(student):profile.avatar;}
function profileAvatarContents(student,profile=prefs(student)){return profile.avatarImage?`<img class="profile-avatar-image" src="${esc(profile.avatarImage)}" alt="">`:esc(profileAvatarFor(student,profile));}
function profileAvatarMark(student,frameOverride=''){
  const frame=frameOverride||prefs(student).avatarFrame;
  return `<span class="profile-avatar avatar-frame-${frame}" data-profile-avatar="${student}" data-profile-avatar-frame="${frameOverride}" aria-hidden="true">${profileAvatarContents(student)}</span>`;
}
function refreshProfileAvatarViews(student,profile=prefs(student)){
  document.querySelectorAll(`[data-profile-avatar="${student}"]`).forEach(avatar=>{const frame=avatar.dataset.profileAvatarFrame||profile.avatarFrame;avatar.innerHTML=profileAvatarContents(student,profile);avatar.className=`profile-avatar avatar-frame-${frame}`;});
  document.querySelectorAll(`.avatar-customizer[data-student="${student}"]`).forEach(section=>{
    section.querySelectorAll('[data-avatar-choice]').forEach(button=>button.setAttribute('aria-pressed',String(!profile.avatarImage&&button.dataset.avatarChoice===profile.avatar)));
    section.querySelectorAll('[data-avatar-frame-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatarFrameChoice===profile.avatarFrame)));
    const summary=section.querySelector('.avatar-summary');if(summary)summary.textContent=`${profile.avatarImage?'Custom image':profileAvatarFor(student,profile)} · ${AVATAR_FRAMES.find(([frame])=>frame===profile.avatarFrame)?.[1]||'Circle'}`;
    const remove=section.querySelector('[data-avatar-image-remove]');if(remove)remove.disabled=!profile.avatarImage;
  });
}
function avatarCustomizer(profile,student){
  const avatars=PROFILE_AVATARS.map(avatar=>{const shown=avatar==='default'?iconOf(student):avatar,label=avatar==='default'?'Default':shown;return `<button type="button" class="avatar-choice" data-avatar-choice="${esc(avatar)}" aria-label="${avatar==='default'?'Use default avatar':`Use ${label} avatar`}" aria-pressed="${!profile.avatarImage&&profile.avatar===avatar}" onclick="setPreference('avatar',${jsArg(avatar)},state.settingsScope)">${shown}</button>`;}).join('');
  const frames=AVATAR_FRAMES.map(([frame,label])=>`<button type="button" class="avatar-frame-choice" data-avatar-frame-choice="${frame}" aria-pressed="${profile.avatarFrame===frame}" onclick="setPreference('avatarFrame','${frame}',state.settingsScope)">${profileAvatarMark(student,frame)}<span>${label}</span></button>`).join('');
  return `<details class="avatar-customizer"><summary>Profile avatar <span class="avatar-summary">${profile.avatarImage?'Custom image':profileAvatarFor(student,profile)} · ${AVATAR_FRAMES.find(([frame])=>frame===profile.avatarFrame)?.[1]||'Circle'}</span></summary><p class="small">Choose an avatar or use a picture for ${nameOf(student)}’s profile.</p><div class="avatar-choice-grid" aria-label="Choose avatar">${avatars}</div><div class="avatar-upload-row"><label class="avatar-upload-control">Upload a picture<input type="file" accept="image/*" onchange="setProfileAvatarImage(this,state.settingsScope)"></label><button type="button" class="text-button danger" data-avatar-image-remove ${profile.avatarImage?'':'disabled'} onclick="clearProfileAvatarImage(state.settingsScope)">Remove picture</button></div><h4>Frame</h4><div class="avatar-frame-options" aria-label="Choose avatar frame">${frames}</div></details>`;
}
function safeLink(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}}
function jsArg(value){return esc(JSON.stringify(String(value)));}
function allTasks(student){return Object.entries(state.assignments?.[student]||{}).flatMap(([subject,rows])=>rows.map(x=>({...x,subject,student})));}
function findTask(id){for(const [student,subjects] of Object.entries(state.assignments||{}))for(const [subject,rows] of Object.entries(subjects)){const index=rows.findIndex(x=>x.id===id);if(index>=0)return {student,subject,index,x:rows[index]};}}
function dbData(rows){const out={leon:{},logan:{}};for(const row of rows||[])(out[row.student][row.subject]??=[]).push({id:row.id,title:row.title,due:row.due||'',done:!!row.done,url:safeLink(row.url),needsHelp:!!row.needsHelp,completedDate:row.completedDate||'',submittedDate:row.submittedDate||'',receiptUrl:safeLink(row.receiptUrl),receiptNote:row.receiptNote||''});return out;}
function scheduleAssignmentSubject(item){
  if(!item||item.type==='break'||item.subject==='break')return'';
  if(item.subject&&item.subject!=='custom')return item.subject;
  const label=String(item.label||'').trim(),normalized=label.toLowerCase().replace(/\s+/g,' ');
  const knownSubject=Object.entries(LABELS).find(([key,name])=>normalized===key||normalized===name.toLowerCase());
  if(knownSubject)return knownSubject[0];
  if(['english language arts','ela'].includes(normalized))return'ela';
  if(['physical ed','p.e.'].includes(normalized))return'pe';
  const slug=normalized.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32);
  return slug?`custom-${slug}`:'custom';
}
function scheduledItems(student){return [...Object.values(state.scheduledDays?.[student]||{}).flat(),...(state.schedules?.[student]||[])];}
function subjectLabel(subject,student='leon'){
  if(LABELS[subject])return LABELS[subject];
  const added=state.assignmentSubjectCatalogs?.[student]?.added?.find(item=>item.id===subject);
  if(added)return added.label;
  const scheduled=scheduledItems(student).find(item=>scheduleAssignmentSubject(item)===subject&&item.label);
  if(scheduled)return scheduled.label;
  return String(subject||'').replace(/[-_]+/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
}
function ensureAssignmentSlots(){
  if(!state.assignments)return;
  for(const student of ['leon','logan']){
    state.assignments[student]??={};
    const catalog=state.assignmentSubjectCatalogs?.[student]||{added:[],hidden:[]},hidden=new Set(catalog.hidden||[]);
    for(const item of scheduledItems(student)){
      const subject=scheduleAssignmentSubject(item);
      if(subject&&!hidden.has(subject))(state.assignments[student][subject]??=[]);
    }
    for(const item of catalog.added||[])if(item?.id&&!hidden.has(item.id))(state.assignments[student][item.id]??=[]);
  }
}
function dueState(x){return x.done?'complete':!x.due?'undated':x.due<scheduleDay()?'late':x.due===scheduleDay()?'today':'future';}
function dueChip(x){const status=dueState(x);return `<span class="status-chip ${status}">${status==='complete'?'Completed':status==='late'?'Past due · '+dateLabel(x.due,false):status==='today'?'Due today':x.due?'Due '+dateLabel(x.due,false):'No due date'}</span>`;}
function nextDueDate(subjects,today=scheduleDay()){return Object.values(subjects).flat().filter(x=>!x.done&&x.due>today).map(x=>x.due).sort()[0]||'';}
function mast(){
  const student=['leon','logan'].includes(state.view);
  const calendarView=state.view==='calendar';
  return `<header class="mast"><a href="#" class="brand" onclick="event.preventDefault();${calendarView?'closeCalendar()':student?'showHub()':state.view==='parent'?"setParentTab('overview')":'render()'}"><span class="brand-mark">${student?profileAvatarMark(state.view):'S'}</span><span><b>School Dashboard</b><small>${calendarView?'Family calendar':student?nameOf(state.view)+'’s school day':state.view==='parent'?'Parent workspace':'Your family’s school day'}</small></span></a>${state.auth?'<button class="button light dashboard-refresh" onclick="refreshDashboard()" aria-label="Refresh dashboard" title="Refresh dashboard"><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7v5h-5"/><path d="M19.5 12a7.5 7.5 0 1 0-2 5.2"/></svg></button>':''}<div class="header-actions">${state.auth&&state.auth.role!=='monitor'?(student?studentBalanceButton(state.view):'<button class="button light" onclick="openRewards()">⭐ Rewards Store</button>'):''}<button class="button light" onclick="${calendarView?'closeCalendar()':'openCalendar()'}">${calendarView?'Back':'📅 Family Calendar'}</button><button class="button light" onclick="openSettings()">Settings</button>${state.view?'<button class="button light" onclick="'+(state.view==='monitor'?'closeMonitor()':'goHome()')+'">'+(state.view==='monitor'?(state.parentReturnSession?'Back to parent':'Close dashboard'):'Sign out')+'</button>':''}</div></header>`;
}
async function openRewards(){
  if(!state.auth||state.auth.role==='monitor')return;
  if(!await pumpWrites()){showToast('Save your pending changes before opening the store.');return;}
  try{const data=await fetchAuth(state.auth);state.rewards=data.rewards;updatePointBalances();drawRewards();}catch{showToast('Couldn’t load the store. Please try again when connected.');}
}
function studentBalanceButton(student){return `<button class="button light student-point-balance" onclick="openRewards()"><span>⭐ <span data-point-balance="${student}" aria-live="polite">${state.rewards?.balances?.[student]??0}</span> points</span><span>Rewards Store →</span></button>`;}
function updatePointBalances(){document.querySelectorAll('[data-point-balance]').forEach(node=>{node.textContent=state.rewards?.balances?.[node.dataset.pointBalance]??0;});}
function openPointAward(student){
  if(state.auth?.role!=='parent'||!['leon','logan'].includes(student))return;
  const id=crypto.randomUUID();
  openDialog('award-points',`<h2>Award points to ${nameOf(student)}</h2><form onsubmit="event.preventDefault();awardPoints(event,${jsArg(student)},${jsArg(id)})"><label>Points<input name="points" type="number" min="1" max="100000" step="1" required autofocus></label><label>Reason <span class="small">Optional</span><input name="reason" maxlength="240" placeholder="For example, great effort today"></label><p id="store-error" class="form-error" role="alert"></p><button class="button" type="submit">Award points</button></form>`);
}
async function awardPoints(event,student,id){
  if(storeBusy)return;storeBusy=true;
  const form=event.currentTarget;
  try{
    const response=await fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role:state.auth.role,password:state.auth.password,rewardAction:'awardPoints',id,student,points:Number(form.elements.points.value),reason:form.elements.reason.value})}),data=await response.json();
    if(!response.ok)throw Error(data.error||'Couldn’t award points. Please retry.');
    state.rewards=data.rewards;closeDialog();render();showToast('Points awarded to '+nameOf(student));
  }catch(error){const node=document.getElementById('store-error');if(node)node.textContent=error.message;}
  finally{storeBusy=false;}
}
function drawRewards(){
  state.rewardCatalog=null;
  const r=state.rewards,parent=state.auth.role==='parent',students=parent?['leon','logan']:[state.auth.role];
  openDialog('rewards',`<h2>⭐ Rewards Store</h2>${storeNavigation('rewards')}<p>Earn 1 point for submitting on the due date, or 2 points for submitting at least a day early. Each unfinished past-due assignment subtracts 1 point from your balance, once per assignment, not per day. Completing it removes that deduction. Late submissions and work without a due date earn no points. Mark completed work submitted to earn points.</p><div class="reward-balances">${students.map(student=>`<strong>${nameOf(student)}: ${r.balances[student]||0} points</strong>`).join('')}</div><p class="small">Corrected dates, reopened work, and removed assignments update earnings. Past purchases stay recorded.</p>${parent?'<button class="button" onclick="editReward()">＋ Add reward</button>':''}<div class="reward-list">${r.items.map(item=>`<article class="panel reward-card"><div><h3>${esc(item.title)}</h3><p>${item.cost} points</p></div><div class="actions">${parent?`<button class="button light" onclick="editReward(${jsArg(item.id)})">Edit</button><button class="text-button danger" onclick="storeAction({rewardAction:'remove',id:${jsArg(item.id)}})">Remove</button>`:`<button class="button" ${(r.balances[state.auth.role]||0)<item.cost?'disabled':''} onclick="confirmReward(${jsArg(item.id)})">Redeem</button>`}</div></article>`).join('')||'<p class="empty">No rewards yet. Parents can add something to work toward.</p>'}</div><h3>Theme unlocks</h3><p class="small">Coastal and Midnight are free. Every other theme costs 5 points once, per child. Browse and unlock everything here in the store. Fonts cost 3 points, UI styles 5, details and avatars 2, and custom-image uploads 4. Every purchase is permanent.</p><button class="button light" onclick="drawUnlockCatalog('themes')">Browse theme unlocks →</button><details class="store-history"><summary>Redemption history</summary>${r.history.map(item=>`<p><strong>${esc(nameOf(item.student))}</strong> · ${esc(item.title)} · ${item.kind==='award'?'+'+item.points:item.cost} points${item.kind==='award'?' · Parent reward':''} <span class="small">${esc(new Date(item.date).toLocaleString())}</span></p>`).join('')||'<p class="small">No rewards redeemed yet.</p>'}</details><p id="store-error" role="alert" class="form-error"></p>`);
}
function storeNavigation(active){return `<nav class="store-nav" aria-label="Rewards Store categories">${[['rewards','Rewards'],['themes','Themes'],['fonts','Fonts'],['styles','UI Styles'],['extras','Extras']].map(([key,label])=>`<button type="button" class="button ${active===key?'':'light'}" aria-pressed="${active===key}" onclick="${key==='rewards'?'drawRewards()':`drawUnlockCatalog('${key}')`}">${label}</button>`).join('')}</nav>`;}
function storeUnlockItems(category){
  const student=state.auth.role,r=state.rewards;
  if(category==='themes')return Object.entries(THEME_PALETTES).map(([id,palette])=>({id,title:palette[0],cost:['coastal','midnight'].includes(id)?0:r.themePrice||5,owned:themeOwned(id,student),theme:true,palette}));
  return Object.values(r.cosmetics||{}).filter(item=>category==='fonts'?item.group==='font':category==='styles'?item.group==='style':!['font','style'].includes(item.group)).filter(item=>item.group!=='font'||student==='parent'||item.value==='system'||prefs(student).allowedFonts.includes(item.value)).map(item=>({...item,owned:cosmeticOwned(item.field,item.value,student)}));
}
function drawUnlockCatalog(category='themes'){
  if(!['themes','fonts','styles','extras'].includes(category))category='themes';
  state.rewardCatalog=category;
  const student=state.auth.role,parent=student==='parent',balance=state.rewards.balances[student]||0,items=storeUnlockItems(category),labels={themes:'Themes',fonts:'Fonts',styles:'UI Styles',extras:'Extras'};
  openDialog('store-unlocks',`<h2>⭐ Rewards Store</h2>${storeNavigation(category)}<div class="store-catalog-heading"><h3>${labels[category]}</h3><strong>${parent?'Preview catalog':`${balance} ${balance===1?'point':'points'} to spend`}</strong></div><p class="small">Permanent unlocks, one purchase per child.${category==='fonts'?' One font purchase covers both text and the clock. Fonts enabled by your parent appear here.':''}${category==='extras'?' Customize avatars, frames, corners, edges, textures, and images. Upload unlocks allow unlimited image changes.':''}${parent?' Sign in as a child to buy an unlock.':''}</p><label class="store-search">Find ${labels[category].toLowerCase()}<input type="search" placeholder="Search names" oninput="filterStoreUnlocks(this.value)"></label><div class="store-unlock-grid">${items.map(item=>`<article class="panel store-unlock-card" data-store-search="${esc((item.title+' '+(item.group||'theme')).toLowerCase())}">${item.theme?`<div class="store-theme-preview" style="background:${item.palette[2]};color:${item.palette[1]}"><span>School day</span><i style="background:${item.palette[1]}"></i></div>`:''}<div><h4>${esc(item.title)}</h4><p class="small">${item.cost===0?'Free':item.owned?'Unlocked':`${item.cost} points`}</p></div>${parent?'':item.owned?(['avatarImage','backgroundImage'].includes(item.field)?'<span class="small">Ready to upload in Settings</span>':`<button class="button light" onclick="useStoreUnlock(${jsArg(item.id)},${!!item.theme})">Use</button>`):`<button class="button" ${balance<item.cost?'disabled':''} onclick="confirmStoreUnlock(${jsArg(item.id)},${!!item.theme})">${balance<item.cost?`Need ${item.cost-balance} more points`:`Unlock · ${item.cost} points`}</button>`}</article>`).join('')}</div><p id="store-search-empty" class="empty" hidden>No matching unlocks.</p><p id="store-error" class="form-error" role="alert"></p>`);
}
function filterStoreUnlocks(value){const query=String(value).trim().toLowerCase();let visible=0;document.querySelectorAll('[data-store-search]').forEach(card=>{card.hidden=!card.dataset.storeSearch.includes(query);if(!card.hidden)visible++;});document.getElementById('store-search-empty').hidden=visible>0;}
function confirmStoreUnlock(id,theme){
  const item=storeUnlockItems(state.rewardCatalog).find(item=>item.id===id);if(!item||item.owned)return;
  openDialog('store-unlock-confirm',`<h2>Unlock ${esc(item.title)}?</h2><p>Spend ${item.cost} points. This unlock is yours permanently.</p><div class="actions"><button class="button" onclick="storeAction({rewardAction:'${theme?'unlockTheme':'unlockCosmetic'}',id:${jsArg(id)}})">Unlock for ${item.cost} points</button><button class="button light" onclick="drawUnlockCatalog(state.rewardCatalog)">Back to store</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
function useStoreUnlock(id,theme){
  const student=state.auth.role,item=storeUnlockItems(state.rewardCatalog).find(item=>item.id===id);if(!item?.owned||!['leon','logan'].includes(student))return;
  if(theme)selectTheme(id,student);else setPreference(item.group==='font'&&item.value!=='system'?'fontStyle':item.field,item.value,student);
  render();drawUnlockCatalog(state.rewardCatalog);showToast('Appearance updated');
}
function editReward(id){
  if(state.auth?.role!=='parent')return;
  const item=state.rewards.items.find(x=>x.id===id)||{id:crypto.randomUUID(),title:'',cost:1};
  openDialog('edit-reward',`<h2>${id?'Edit':'Add'} reward</h2><form onsubmit="event.preventDefault();storeAction({rewardAction:'save',id:${jsArg(item.id)},title:this.elements.title.value,cost:Number(this.elements.cost.value)})"><label>Reward name<input name="title" maxlength="160" required value="${esc(item.title)}"></label><label>Point price<input name="cost" type="number" min="1" max="100000" step="1" required value="${item.cost}"></label><div class="actions"><button class="button" type="submit">Save reward</button><button class="button light" type="button" onclick="drawRewards()">Cancel</button></div><p id="store-error" class="form-error" role="alert"></p></form>`);
}
function confirmReward(id){
  const item=state.rewards.items.find(x=>x.id===id);if(!item)return;
  const requestId=crypto.randomUUID();
  openDialog('redeem-reward',`<h2>Redeem ${esc(item.title)}?</h2><p>Spend ${item.cost} points on this reward. Your parent can see this purchase in the redemption history.</p><div class="actions"><button class="button" onclick="storeAction({rewardAction:'redeem',id:${jsArg(id)},requestId:${jsArg(requestId)}})">Spend ${item.cost} points</button><button class="button light" onclick="drawRewards()">Cancel</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
let storeBusy=false;
async function openThemeUnlock(theme,student){
  if(state.auth?.role!==student){showToast('Sign in as '+nameOf(student)+' to buy this theme for 5 points.');return;}
  if(!await pumpWrites()){showToast('Save your pending changes first.');return;}
  try{state.rewards=(await fetchAuth(state.auth)).rewards;}catch{showToast('Connect to load your point balance.');return;}
  if(themeOwned(theme,student)){drawSettings();return;}
  const balance=state.rewards.balances[student]||0;
  openDialog('unlock-theme',`<h2>Unlock ${esc(THEME_PALETTES[theme][0])}</h2><p>5 points · Yours permanently, including presets that use this palette.</p><p>You have ${balance} points.</p><div class="actions"><button class="button" ${balance<5?'disabled':''} onclick="storeAction({rewardAction:'unlockTheme',id:${jsArg(theme)}})">Unlock for 5 points</button><button class="button light" onclick="drawSettings()">Back to themes</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
async function storeAction(body){
  if(storeBusy)return;storeBusy=true;
  try{
    const response=await fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...body,role:state.auth.role,password:state.auth.password})}),data=await response.json();
    if(!response.ok)throw Error(data.error||'Couldn’t save. Please retry.');
    state.rewards=data.rewards;updatePointBalances();if(state.rewardCatalog)drawUnlockCatalog(state.rewardCatalog);else drawRewards();showToast(['unlockTheme','unlockCosmetic'].includes(body.rewardAction)?'Unlocked! You can use it now.':body.rewardAction==='redeem'?'Reward redeemed!':'Rewards updated');
  }catch(error){const node=document.getElementById('store-error');if(node)node.textContent=error.message;}
  finally{storeBusy=false;}
}
function dashboardClock(){return '<time class="dashboard-clock" id="dashboard-clock" aria-label="Current time"></time>';}
function updateDashboardClock(){
  const clock=document.getElementById('dashboard-clock');if(!clock)return;
  const now=new Date(),format=prefs().clockFormat;clock.dateTime=now.toISOString();clock.textContent=now.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',hour12:format!=='24h'});
}
const FOCUS_TIMER_SECONDS={focus:25*60,break:5*60};
const FOCUS_TIMER_PRESETS=[15,25,45];
function focusTimerDuration(timer){return timer.mode==='focus'?(FOCUS_TIMER_PRESETS.includes(timer.focusMinutes)?timer.focusMinutes:25)*60:FOCUS_TIMER_SECONDS.break;}
function focusTimerState(student=state.view){
  const value=localRead(`school-focus-timer-${student}`,null);
  if(!value||!['focus','break'].includes(value.mode))return {mode:'focus',focusMinutes:25,remaining:FOCUS_TIMER_SECONDS.focus,endsAt:0,focusTaskId:''};
  const focusMinutes=FOCUS_TIMER_PRESETS.includes(Number(value.focusMinutes))?Number(value.focusMinutes):25,duration=value.mode==='focus'?focusMinutes*60:FOCUS_TIMER_SECONDS.break;
  return {mode:value.mode,focusMinutes,remaining:Math.max(0,Math.min(duration,Number(value.remaining)||0)),endsAt:Math.max(0,Number(value.endsAt)||0),focusTaskId:String(value.focusTaskId||'')};
}
function focusTimerRemaining(timer){return timer.endsAt?Math.max(0,Math.ceil((timer.endsAt-Date.now())/1000)):timer.remaining;}
function formatFocusTimer(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function saveFocusTimer(timer,student=state.view){localWrite(`school-focus-timer-${student}`,timer);}
function selectFocusTimerMode(mode){if(!FOCUS_TIMER_SECONDS[mode])return;const timer=focusTimerState();timer.mode=mode;timer.remaining=focusTimerDuration(timer);timer.endsAt=0;saveFocusTimer(timer);updateFocusTimer();}
function setFocusTimerLength(minutes){if(!FOCUS_TIMER_PRESETS.includes(Number(minutes)))return;const timer=focusTimerState();timer.focusMinutes=Number(minutes);if(timer.mode==='focus'){timer.remaining=focusTimerDuration(timer);timer.endsAt=0;}saveFocusTimer(timer);updateFocusTimer();}
function setFocusTask(id){const timer=focusTimerState();timer.focusTaskId=id;saveFocusTimer(timer);updateFocusTimer();}
function startFocusTimer(){const timer=focusTimerState();if(!timer.remaining)timer.remaining=focusTimerDuration(timer);timer.endsAt=Date.now()+timer.remaining*1000;saveFocusTimer(timer);updateFocusTimer();}
function pauseFocusTimer(){const timer=focusTimerState();if(!timer.endsAt)return;timer.remaining=focusTimerRemaining(timer);timer.endsAt=0;saveFocusTimer(timer);updateFocusTimer();}
function resetFocusTimer(){const timer=focusTimerState();timer.remaining=focusTimerDuration(timer);timer.endsAt=0;saveFocusTimer(timer);updateFocusTimer();}
function updateFocusTimer(){
  const output=document.getElementById('focus-time');if(!output)return;
  const timer=focusTimerState(),remaining=focusTimerRemaining(timer);let running=!!timer.endsAt;
  if(running&&remaining===0){timer.remaining=0;timer.endsAt=0;running=false;saveFocusTimer(timer);showToast(timer.mode==='focus'?'Focus session complete. Nice work!':'Break complete. Ready to focus again?');}
  else if(!running)timer.remaining=remaining;
  output.textContent=formatFocusTimer(remaining);
  const selected=allTasks(state.view).find(task=>String(task.id)===timer.focusTaskId),taskLabel=document.getElementById('focus-task-current');
  if(taskLabel)taskLabel.textContent=selected?`Working on: ${selected.title}`:'Choose a task, or use the timer on its own.';
  document.getElementById('focus-status').textContent=running?'In progress':remaining===0?'Complete':`Ready · ${timer.mode==='focus'?'focus session':'break'}`;
  document.querySelectorAll('[data-focus-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.focusMode===timer.mode)));
  document.querySelectorAll('[data-focus-length]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.focusLength)===timer.focusMinutes)));
  document.getElementById('focus-start').disabled=running;document.getElementById('focus-pause').disabled=!running;
}
function focusTimerPanel(){
  const timer=focusTimerState(),remaining=focusTimerRemaining(timer);
  const openTasks=allTasks(state.view).filter(task=>!task.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  const taskOptions=timer.focusTaskId&&!openTasks.some(task=>String(task.id)===timer.focusTaskId)?`<option value="${esc(timer.focusTaskId)}" selected>Previously selected task</option>`:'';
  return `<section class="focus-timer panel" aria-label="Focus timer"><div class="focus-timer-info"><div class="section-heading"><h2>Focus timer</h2><span id="focus-status" class="small">${timer.endsAt?'In progress':remaining===0?'Complete':`Ready · ${timer.mode==='focus'?'focus session':'break'}`}</span></div><div class="focus-controls"><div class="segmented" aria-label="Timer mode"><button type="button" data-focus-mode="focus" aria-pressed="${timer.mode==='focus'}" onclick="selectFocusTimerMode('focus')">Focus</button><button type="button" data-focus-mode="break" aria-pressed="${timer.mode==='break'}" onclick="selectFocusTimerMode('break')">Break · 5 min</button></div><div class="focus-presets" aria-label="Focus session length">${FOCUS_TIMER_PRESETS.map(minutes=>`<button type="button" data-focus-length="${minutes}" aria-pressed="${timer.focusMinutes===minutes}" onclick="setFocusTimerLength(${minutes})">${minutes} min</button>`).join('')}</div></div><label class="focus-task-picker">Working on<select onchange="setFocusTask(this.value)"><option value="">Choose a task (optional)</option>${taskOptions}${openTasks.map(task=>`<option value="${esc(task.id)}" ${String(task.id)===timer.focusTaskId?'selected':''}>${esc(subjectLabel(task.subject,task.student))} · ${esc(task.title)}</option>`).join('')}</select></label><span id="focus-task-current" class="small">${openTasks.find(task=>String(task.id)===timer.focusTaskId)?`Working on: ${esc(openTasks.find(task=>String(task.id)===timer.focusTaskId).title)}`:'Choose a task, or use the timer on its own.'}</span></div><output id="focus-time" class="focus-time" aria-label="Time remaining">${formatFocusTimer(remaining)}</output><div class="focus-actions"><button id="focus-start" class="button" onclick="startFocusTimer()" ${timer.endsAt?'disabled':''}>Start</button><button id="focus-pause" class="button light" onclick="pauseFocusTimer()" ${timer.endsAt?'':'disabled'}>Pause</button><button class="text-button" onclick="resetFocusTimer()">Reset</button></div></section>`;
}
function resources(student=false){
  const links=[SCHOOL_LINKS.star,SCHOOL_LINKS.horizon,student?SCHOOL_LINKS.support:SCHOOL_LINKS.focus];
  return `<section class="resources panel"><div class="section-heading"><h2>School Resources</h2><span class="small">Opens in a new tab</span></div><nav aria-label="School resources">${links.map(([label,url])=>`<a class="resource-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`).join('')}</nav></section>`;
}
function openResources(){openDialog('school-resources',`<h2>School Resources</h2>${resources(['leon','logan'].includes(state.view))}`);}
function displayCards(forScope){const reminders=(state.displayCards[forScope]||[]).filter(Boolean);return reminders.length?`<section class="quick-reminders" aria-label="Quick reminders"><h2>Quick reminders</h2><div class="reminder-grid">${reminders.map((text,index)=>`<article class="reminder"><span aria-hidden="true">${['✨','📚','💧','⭐'][index%4]}</span>${esc(text.replace(/^(?:🎯|📚|💧|⭐)\s*/,''))}</article>`).join('')}</div></section>`:'';}
function easternDateTimeNow(){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;}
function announcementWhen(item){if(!item.startsAt)return'Live now';const date=item.startsAt.slice(0,10),time=item.startsAt.slice(11),now=easternDateTimeNow(),today=now.slice(0,10);return date<today?'Expired':date===today?(item.startsAt<=now?'Showing today':`Today at ${formatScheduleTime(time)}`):`${dateLabel(date,false)} at ${formatScheduleTime(time)}`;}
function visibleAnnouncements(student,now=easternDateTimeNow()){const today=now.slice(0,10);return(state.announcements[student]||[]).filter(item=>item.enabled&&(!item.title&&!item.message?false:!item.startsAt||item.startsAt.slice(0,10)===today&&item.startsAt<=now));}
function announcementBanner(student){const styles={celebration:{icon:'🎉',label:'A celebration for you'},encouragement:{icon:'💪',label:'A little encouragement'},notice:{icon:'📣',label:'A note for today'}};return visibleAnnouncements(student).map(announcement=>{const style=styles[announcement.style]||styles.celebration;return `<section class="announcement ${announcement.style}" data-announcement-id="${esc(announcement.id)}" aria-label="Announcement for ${nameOf(student)}" aria-live="polite"><div class="announcement-sparkles" aria-hidden="true">${announcement.style==='celebration'?'✦　✧　✦':''}</div><div class="announcement-label"><span aria-hidden="true">${style.icon}</span>${style.label}</div>${announcement.title?`<h2>${esc(announcement.title)}</h2>`:''}${announcement.message?`<p>${esc(announcement.message)}</p>`:''}</section>`;}).join('');}
function studentAnnouncementStack(student){const announcements=announcementBanner(student),cards=displayCards(student);return announcements||cards?`<section id="${student}-notes" class="dashboard-notes panel fixed-notes"><h2>Notes &amp; reminders <span class="count">${visibleAnnouncements(student).length+(state.displayCards[student]||[]).length}</span></h2><div id="student-announcements">${announcements}</div>${cards}</section>`:'';}

function refreshVisibleAnnouncements(){if(!['leon','logan'].includes(state.view))return;const target=document.getElementById('student-announcements');if(!target)return;const visible=visibleAnnouncements(state.view).map(item=>item.id).join('|'),shown=[...target.querySelectorAll('[data-announcement-id]')].map(node=>node.dataset.announcementId).join('|');if(visible!==shown)target.innerHTML=announcementBanner(state.view);}
function dashboardCardsPayload(){return{leon:state.displayCards.leon,logan:state.displayCards.logan,announcements:state.announcements};}
function potentialTaskPoints(x,today=scheduleDay()){
  if(x.done||x.submittedDate||!x.due||x.due<today)return 0;
  return x.due===today?1:2;
}
function studentPointPreview(student,readonly=false){return !readonly&&state.view===student&&['leon','logan'].includes(student)&&state.auth?.role===student;}
function potentialPointsTotal(rows,student,readonly=false){
  if(!studentPointPreview(student,readonly))return '';
  const total=rows.reduce((sum,x)=>sum+potentialTaskPoints(x),0);
  return `<p class="potential-points-total"><strong>⭐ ${total} ${total===1?'point':'points'} available</strong><span>Submit these assignments today to earn points.</span></p>`;
}
function task(x,student=state.view,readonly=false){
  const disabled=readonly||state.auth?.role==='monitor',studentSession=['leon','logan'].includes(state.auth?.role),id=jsArg(x.id),url=safeLink(x.url);
  const proof=[];
  if(x.completedDate)proof.push(`Completed ${dateLabel(x.completedDate,false)}`);
  if(x.submittedDate)proof.push(`Submitted ${dateLabel(x.submittedDate,false)}`);
  const receiptUrl=safeLink(x.receiptUrl),receipt=receiptUrl?`<a href="${esc(receiptUrl)}" target="_blank" rel="noopener noreferrer">Open receipt ↗</a>`:'';
  return `<article class="task ${x.done?'done':''}" data-task-id="${esc(x.id)}"><label class="completion"><input type="checkbox" ${x.done?'checked':''} ${disabled?'disabled':''} onchange="toggleTask(${id},this.checked,this)" aria-label="${x.done?'Reopen':'Complete'} ${esc(x.title)}"></label><div class="task-content"><span class="task-name">${esc(x.title)}</span><div class="task-meta">${dueChip(x)}${studentPointPreview(student,readonly)&&!x.done&&x.due&&x.due<scheduleDay()?'<span class="status-chip late">−1 point from balance</span>':studentPointPreview(student,readonly)&&!x.done&&!x.submittedDate?`<span class="status-chip potential-points">⭐ ${potentialTaskPoints(x)} ${potentialTaskPoints(x)===1?'point':'points'}${potentialTaskPoints(x)?' if submitted today':''}</span>`:''}${x.needsHelp&&!x.done?'<span class="status-chip help">Needs help</span>':''}</div>${proof.length||receipt||x.receiptNote?`<div class="completion-record">${proof.length?`<span>${proof.map(esc).join(' · ')}</span>`:''}${receipt}${x.receiptNote?`<span>${esc(x.receiptNote)}</span>`:''}</div>`:''}<div class="task-actions">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open assignment ↗</a>`:''}${receiptUrl?'':receipt}${studentSession&&x.done&&!x.submittedDate?`<button class="text-button" onclick="markSubmitted(${id})">Mark submitted today</button>`:''}${studentSession&&!x.done?`<button class="text-button" aria-pressed="${!!x.needsHelp}" onclick="toggleHelp(${id})">${x.needsHelp?'Clear help request':'I need help'}</button>`:''}</div></div></article>`;
}
function taskGroups(subjects,filter,student=state.view,readonly=false){
  const groups=Object.entries(subjects).map(([subject,rows])=>[subject,rows.filter(filter).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'))]).filter(([,rows])=>rows.length);
  return groups.map(([subject,rows])=>`<details class="subject-group" open><summary><span class="subject-dot" style="--subject-color:var(--subject-${subject},var(--accent))"></span>${esc(subjectLabel(subject,student))}<span class="count">${rows.length}</span></summary><div class="assignment-list">${rows.map(x=>task(x,student,readonly)).join('')}</div></details>`).join('');
}
function workSection(subjects,status,student=state.view,readonly=false){
  const today=scheduleDay(),filter=x=>!x.done&&x.due&&(status==='today'?x.due===today:x.due<today),rows=Object.values(subjects).flat().filter(filter),count=rows.length;
  return `<details id="${student}-${status}-work" class="work-section ${status}"><summary class="section-heading"><h2>${status==='today'?'Due Today':'Past Due'} <span class="count">${count}</span></h2></summary>${status==='today'?potentialPointsTotal(rows,student,readonly):''}${count?`<div class="due-list" tabindex="0" role="region" aria-label="${nameOf(student)} ${status==='today'?'due today':'past due'} assignments">${taskGroups(subjects,filter,student,readonly)}</div>`:`<p class="empty">${status==='today'?'You’re caught up for today.':'No past-due assignments.'}</p>`}</details>`;
}
function workingAhead(subjects,student=state.view,readonly=false){
  const date=nextDueDate(subjects),rows=Object.values(subjects).flat().filter(x=>!x.done&&date&&x.due===date),count=rows.length;
  return `<details id="${student}-ahead-work" class="work-section ahead"><summary class="section-heading"><h2>Working Ahead <span class="count">${count}</span></h2><span class="small">${date?'Next due · '+dateLabel(date):'Next due date'}</span></summary>${potentialPointsTotal(rows,student,readonly)}${date?`<div class="due-list" tabindex="0" role="region" aria-label="${nameOf(student)} working ahead assignments">${taskGroups(subjects,x=>!x.done&&x.due===date,student,readonly)}</div>`:'<p class="empty">No upcoming assignments.</p>'}</details>`;
}
function scheduleMinutes(value){const [h,m]=String(value||'').split(':').map(Number);return Number.isInteger(h)&&Number.isInteger(m)?h*60+m:-1;}
function formatScheduleTime(value){const minutes=scheduleMinutes(value);if(minutes<0)return'';const hour=Math.floor(minutes/60),minute=minutes%60;return prefs().clockFormat==='24h'?`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`:`${hour%12||12}:${String(minute).padStart(2,'0')}\u00a0${hour<12?'AM':'PM'}`;}
function scheduleLabel(item,student='leon'){
  const subject=item.subject||'',className=item.type==='break'||subject==='break'?'Break':subject==='custom'?'Custom':subjectLabel(subject,student);
  const raw=String(item.label||'').trim();
  let label=raw.replace(/\(?\boptional\b\)?\s*[-:·]?/gi,'').replace(/\s+with\s+(?:(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+).*/i,'').replace(/\b(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+[\p{L}-]+(?:['’]s)?\s*[-:·]?\s*/gu,'').trim();
  const special=/\b(small\s*group|help|office|workshop|field\s*trip|assembly|test|exam|quiz|assessment|presentation|guest|project|lab|make[ -]?up|cancelled|canceled|rescheduled|orientation|conference|celebration)\b/i.test(label);
  const routine=/^(?:english\s+language\s+arts|language\s+arts|ELA|math(?:ematics)?|science|social\s+studies|STEM|spanish|physical\s+education|P\.?E\.?|art|ed\s*tech|technology)(?:\b|\d)/i.test(label)||/^(?:live\s+)?(?:lesson|class)(?:\s|$)/i.test(label);
  if(subject==='custom'||className==='Break'){
    label=label||className;
  }else if(!special&&(routine||label.toLocaleLowerCase()===className.toLocaleLowerCase())){
    label=className;
  }else{
    label=label.replace(/^(?:english\s+language\s+arts|language\s+arts|ELA|math(?:ematics)?|science|social\s+studies|STEM)\s*[·:–-]?\s*/i,'').trim();
    label=label?`${className} · ${label}`:className;
  }
  const text=label;
  return item.optional?`Optional · ${text}`:text;
}
function scheduleItemStyle(item){return `--item-color:var(--subject-${item.subject},var(--accent))`;}
function scheduleSnapshot(student){
  const items=scheduleFor(student).filter(x=>!x.optional&&scheduleMinutes(x.time)>=0).sort((a,b)=>scheduleMinutes(a.time)-scheduleMinutes(b.time)),minutes=schoolMinutes();
  const active=items.findIndex((x,i)=>!x.optional&&scheduleMinutes(x.time)<=minutes&&(x.endTime?minutes<scheduleMinutes(x.endTime):items[i+1]?minutes<scheduleMinutes(items[i+1].time):true));
  const started=active>=0?active:items.findLastIndex(x=>scheduleMinutes(x.time)<=minutes),next=items.findIndex(x=>scheduleMinutes(x.time)>minutes);
  const end=started<0?-1:items[started].endTime?scheduleMinutes(items[started].endTime):items[started+1]?scheduleMinutes(items[started+1].time):-1;
  const current=started>=0&&(end<0||minutes<end)?started:-1;
  // Old schedules without a final end time retain an honest last-started label.
  const visibleItems=items.flatMap((item,i)=>{
    const itemEnd=item.endTime?scheduleMinutes(item.endTime):items[i+1]?scheduleMinutes(items[i+1].time):-1;
    const elapsed=itemEnd>=0&&minutes>=itemEnd;
    return elapsed?[]:[{item,status:i===current?'current':''}];
  });
  const previous=started>=0?(current>=0?started-1:started):-1;
  return {items,visibleItems,previous,current,next,currentLabel:end<0&&started>=0?'Latest start':'Now'};
}
function classTimeline(student=state.view){
  const {items,previous,current,next,currentLabel}=scheduleSnapshot(student);
  const card=(index,label,kind)=>`<div class="class-timeline-card ${kind}"><span class="small">${label}</span>${index>=0?`<strong>${esc(scheduleLabel(items[index],student))}</strong><time>${formatScheduleTime(items[index].time)}${items[index].endTime?' – '+formatScheduleTime(items[index].endTime):''}</time>`:`<strong>${kind==='previous'?'No previous class':kind==='current'?'No class right now':'No more classes'}</strong>`}</div>`;
  return `<div class="class-orbit">${card(previous,'Previous','previous')}<div class="class-orbit-center">${dashboardClock()}${card(current,'Current','current')}</div>${card(next,'Next','next')}</div>`;
}
function schedulePanel(student=state.view,showNowNext=true){
  const {items,visibleItems,current,next,currentLabel}=scheduleSnapshot(student);
  const slot=(index,label)=>`<div class="now-slot ${['Now','Latest start'].includes(label)&&index>=0?'current-now':''}"><span class="small">${label}</span>${index>=0?`<strong>${esc(scheduleLabel(items[index],student))}</strong><span>${formatScheduleTime(items[index].time)}${items[index].endTime?' – '+formatScheduleTime(items[index].endTime):''}</span>`:'<strong>'+(label==='Next'?'No more classes':'No class right now')+'</strong>'}</div>`;
  const canPreview=state.view==='monitor'||['leon','logan'].includes(state.view)&&state.view===student;
  const previewButton=canPreview?`<button class="button light" onclick="previewTomorrowSchedule('${student}')">Preview tomorrow</button>`:'';
  const pinned=['leon','logan'].includes(state.view)&&state.view===student;
  const scheduleTag=pinned?'section':'details',scheduleHeading=pinned?'h2':'summary';
  const scheduleDetails=items.length?`<${scheduleTag} id="${student}-daily-schedule" class="${pinned?'fixed-schedule':'dashboard-disclosure'} daily-schedule ${showNowNext?'panel':''}"><${scheduleHeading}>Today’s schedule <span class="count">${visibleItems.length}</span></${scheduleHeading}>${visibleItems.length?`<div class="schedule-list">${visibleItems.map(({item,status})=>`<div class="schedule-item ${status}" style="${scheduleItemStyle(item)}"><span>${esc(scheduleLabel(item,student))}</span><time>${formatScheduleTime(item.time)}${item.endTime?' – '+formatScheduleTime(item.endTime):''}</time></div>`).join('')}</div>`:'<p class="empty">No upcoming schedule items today.</p>'}</${scheduleTag}>`:'';
  if(!showNowNext)return `<div class="schedule-stack" data-schedule="${student}"><section class="schedule panel"><div class="section-heading">${previewButton}</div>${scheduleDetails||`<${scheduleTag} class="daily-schedule fixed-schedule"><${scheduleHeading}>Today’s schedule <span class="count">0</span></${scheduleHeading}><p class="empty">No schedule set for today.</p></${scheduleTag}>`}</section></div>`;
  return `<div class="schedule-stack" data-schedule="${student}"><section class="schedule panel"><div class="section-heading">${previewButton}</div>${items.length?`<div class="now-next">${slot(current,currentLabel)}${slot(next,'Next')}</div>`:'<p class="empty">No schedule set for today.</p>'}</section>${scheduleDetails}</div>`;
}
function previewTomorrowSchedule(student=state.view){
  if(!['leon','logan'].includes(student))return;
  const date=addDays(scheduleDay(),1),items=scheduleFor(student,date).filter(x=>scheduleMinutes(x.time)>=0).sort((a,b)=>scheduleMinutes(a.time)-scheduleMinutes(b.time));
  const content=items.length?`<div class="schedule-list">${items.map(item=>`<div class="schedule-item" style="${scheduleItemStyle(item)}"><span>${esc(scheduleLabel(item,student))}</span><time>${formatScheduleTime(item.time)}${item.endTime?' – '+formatScheduleTime(item.endTime):''}</time></div>`).join('')}</div>`:'<p class="empty">No schedule is set for tomorrow.</p>';
  openDialog('tomorrow-schedule',`<h2>${nameOf(student)}’s schedule for tomorrow</h2><p class="small">${dateLabel(date)} · Preview only</p>${content}`);
}
function showHub(){state.subjectView=null;render();}
function optionalSessions(student=state.view){
  const items=scheduleFor(student).filter(x=>x.optional&&scheduleMinutes(x.time)>=0).sort((a,b)=>scheduleMinutes(a.time)-scheduleMinutes(b.time));
  const pinned=['leon','logan'].includes(state.view)&&state.view===student,tag=pinned?'section':'details',heading=pinned?'h2':'summary';
  return `<${tag} id="${student}-optional-sessions" class="panel optional-sessions ${pinned?'fixed-schedule':'dashboard-disclosure'}" aria-label="Optional sessions"><${heading}>Optional sessions <span class="count">${items.length}</span></${heading}><p class="small">Join if you’d like extra help. These are your choice and aren’t part of your class rotation.</p>${items.length?`<div class="schedule-list">${items.map(item=>`<div class="schedule-item" style="${scheduleItemStyle(item)}"><span>${esc(scheduleLabel(item,student))}</span><time>${formatScheduleTime(item.time)}${item.endTime?' – '+formatScheduleTime(item.endTime):''}</time></div>`).join('')}</div>`:'<p class="empty">No optional sessions today.</p>'}</${tag}>`;
}
function openSubject(subject){state.subjectView=subject;state.subjectTaskView='all';render();}
function classBrowser(){const subjects=state.assignments[state.view];return `<section class="panel"><h2>Classes</h2><div class="class-picker">${Object.entries(subjects).map(([subject,rows])=>`<button class="button light" onclick="openSubject(${jsArg(subject)})"><span class="subject-dot" style="--subject-color:var(--subject-${subject},var(--accent))"></span><span>${esc(subjectLabel(subject,state.view))}<small>${rows.filter(x=>!x.done).length} to do</small></span></button>`).join('')}</div></section>`;}
function studentPage(){
  const subjects=state.assignments[state.view],today=scheduleDay(),rows=Object.values(subjects).flat(),due=rows.filter(x=>x.due===today),complete=due.filter(x=>x.done).length;
  const overdue=rows.filter(x=>!x.done&&x.due&&x.due<today).length,nextDate=nextDueDate(subjects),ahead=rows.filter(x=>!x.done&&nextDate&&x.due===nextDate).length;
  const hero=`<section class="page-heading student-page-heading"><div class="student-date"><div class="student-identity">${profileAvatarMark(state.view)}<h1>${nameOf(state.view)}</h1></div><p class="small">${dateLabel(today)}</p></div>${classTimeline(state.view)}<div class="heading-summary"><nav class="work-shortcuts" aria-label="Jump to assignments"><a class="late" href="#${state.view}-late-work" onclick="document.getElementById('${state.view}-late-work').open=true">Past Due <b>${overdue}</b></a><a href="#${state.view}-today-work" onclick="document.getElementById('${state.view}-today-work').open=true">Today <b>${due.length-complete}</b></a><a href="#${state.view}-ahead-work" onclick="document.getElementById('${state.view}-ahead-work').open=true">Next <b>${ahead}</b></a></nav><span class="progress-caption">${due.length?complete+' of '+due.length+' due today completed':'A fresh day to learn'}</span></div></section>`;
  if(state.subjectView){
    const subject=state.subjectView,items=subjects[subject]||[],filter=x=>(!prefs().hideCompleted||!x.done)&&(state.subjectTaskView!=='soon'||x.due&&x.due<=addDays(today,7));
    return mast()+studentAnnouncementStack(state.view)+`<section class="page-heading"><div><button class="text-button" onclick="showHub()">← Back to dashboard</button><h1>${esc(subjectLabel(subject,state.view))}</h1></div></section><div class="toolbar"><label class="switch"><input type="checkbox" ${prefs().hideCompleted?'checked':''} onchange="setPreference('hideCompleted',this.checked)">Hide completed</label><div class="segmented"><button aria-pressed="${state.subjectTaskView!=='soon'}" onclick="state.subjectTaskView='all';render()">All work</button><button aria-pressed="${state.subjectTaskView==='soon'}" onclick="state.subjectTaskView='soon';render()">Due within a week</button></div></div><section class="panel assignment-list">${items.filter(filter).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).map(x=>task(x)).join('')||'<p class="empty">No assignments in this view.</p>'}</section>`;
  }
  return mast()+studentAnnouncementStack(state.view)+hero+`<div class="student-dashboard-grid"><div class="work-board">${workSection(subjects,'late')}${workSection(subjects,'today')}<div class="student-ahead-stack">${workingAhead(subjects)}${optionalSessions(state.view)}</div></div>${schedulePanel(state.view,false)}</div>`/* Focus timer parked for later: +focusTimerPanel() */+(prefs().classBrowser?classBrowser():'');
}
function loginPage(){return mast()+`<section class="login"><p class="eyebrow">Your day, organized</p><h1>Ready for your school day?</h1><p class="small">Choose your profile to see classes and assignments.</p><div class="people">${['leon','logan'].map(student=>`<button class="person" onclick="signIn('${student}')">${profileAvatarMark(student)}<b>${nameOf(student)}</b><span class="small">Open my dashboard</span></button>`).join('')}</div><div class="home-actions"><button class="button light" onclick="signIn('parent')">Parent sign in</button></div>${state.loadError?`<p class="form-error" role="alert">${esc(state.loadError)}</p><button class="button light" onclick="restoreSession()">Retry connection</button>`:''}</section>`;}
function render(){
  const expanded=new Map([...app.querySelectorAll('details.work-section,details.dashboard-disclosure')].map(node=>[node.id,node.open]));
  ensureAssignmentSlots();
  applyPreferences();app.className='shell'+(state.view==='parent'?' parent-workspace':state.view==='monitor'?' shared-workspace':['leon','logan'].includes(state.view)?' student-workspace':'');
  if(!state.view)app.innerHTML=loginPage();
  else if(state.view==='calendar')app.innerHTML=calendarPage();
  else if(state.view==='parent')app.innerHTML=parentPage();
  else if(state.view==='monitor')app.innerHTML=sharedPage();
  else app.innerHTML=studentPage();
  updateDashboardClock();updateFocusTimer();
  for(const node of app.querySelectorAll('details.work-section,details.dashboard-disclosure')){node.open=expanded.get(node.id)??(prefs().dashboardExpanded===true||node.classList.contains('work-section')&&!node.classList.contains('ahead')&&Number(node.querySelector('.count')?.textContent)>0);node.addEventListener('toggle',updateWorkOverflow);}
  for(const node of app.querySelectorAll('details.subject-group'))node.addEventListener('toggle',updateWorkOverflow);
  updateSyncStatus();updateWorkOverflow();
  const help=document.querySelector('[data-help-student]');if(help)help.innerHTML=helpInbox(help.dataset.helpStudent);
  const editor=document.querySelector('dialog[data-dialog="assignments"] .assignment-popout-body');if(editor)editor.innerHTML=assignmentEditor();
}
async function openCalendar(){
  state.calendarReturnView=state.view||null;
  if(!state.auth){
    try{const data=await fetchAuth({role:'monitor'});state.auth={role:'monitor'};state.familyCalendar=Array.isArray(data.calendar)?data.calendar:[];}
    catch{showToast('Couldn’t open the family calendar. Please try again.');return;}
  }
  const today=scheduleDay();state.calendarMonth=(state.calendarMonth||today.slice(0,7));state.calendarDate=state.calendarDate||today;state.view='calendar';render();
}
function closeCalendar(){const back=state.calendarReturnView;state.calendarReturnView=null;if(back){state.view=back;render();}else goHome();}
function moveCalendarMonth(amount){const [year,month]=state.calendarMonth.split('-').map(Number),date=new Date(Date.UTC(year,month-1+amount,1));state.calendarMonth=`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;render();}
function calendarEventsOn(date){return (state.familyCalendar||[]).filter(item=>item.date===date).sort((a,b)=>(a.start||'').localeCompare(b.start||'')||a.title.localeCompare(b.title));}
function calendarTime(event){return event.start?`${formatScheduleTime(event.start)}${event.end?' – '+formatScheduleTime(event.end):''}`:'All day';}
function calendarPage(){
  const [year,month]=state.calendarMonth.split('-').map(Number),first=new Date(Date.UTC(year,month-1,1)),offset=first.getUTCDay(),cells=Math.ceil((offset+new Date(Date.UTC(year,month,0)).getUTCDate())/7)*7,canEdit=state.auth?.role==='parent',selected=state.calendarDate||scheduleDay(),events=calendarEventsOn(selected);
  const days=Array.from({length:cells},(_,index)=>{const date=new Date(Date.UTC(year,month-1,1-offset+index)),iso=date.toISOString().slice(0,10),inside=date.getUTCMonth()===month-1,past=iso<scheduleDay(),items=calendarEventsOn(iso);return `<button type="button" class="calendar-day ${inside?'':'outside'} ${past?'past':''} ${iso===selected?'selected':''} ${iso===scheduleDay()?'today':''}" aria-label="${esc(dateLabel(iso))}${past?', past date':''}, ${items.length} events" aria-pressed="${iso===selected}" onclick="state.calendarDate='${iso}';render()"><span class="calendar-day-number">${date.getUTCDate()}</span>${items.slice(0,2).map(item=>`<span class="calendar-dot-event">${esc(item.title)}</span>`).join('')}${items.length>2?`<span class="calendar-more">+${items.length-2} more</span>`:''}</button>`;}).join('');
  return mast()+`<section class="page-heading calendar-heading"><div><p class="small">Shared family calendar</p><h1>Family Calendar</h1><p class="small">Events are shown in your local time zone. ${canEdit?'You can add, change, and remove events.':'Ask a parent to add or change events.'}</p></div>${canEdit?'<button class="button" onclick="openCalendarEventForm()">＋ Add event</button>':''}</section><section class="calendar-layout"><div class="panel calendar-month-panel"><div class="calendar-toolbar"><button class="button light" onclick="moveCalendarMonth(-1)" aria-label="Previous month">←</button><h2>${first.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})}</h2><button class="button light" onclick="moveCalendarMonth(1)" aria-label="Next month">→</button><button class="button light" onclick="state.calendarMonth=scheduleDay().slice(0,7);state.calendarDate=scheduleDay();render()">Today</button></div><div class="calendar-grid" role="grid" aria-label="${first.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'})}">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=>`<div class="calendar-weekday" role="columnheader">${day}</div>`).join('')}${days}</div></div><aside class="panel calendar-agenda"><div class="section-heading"><div><p class="small">Selected day</p><h2>${esc(dateLabel(selected))}</h2></div>${canEdit?`<button class="button light" onclick="openCalendarEventForm(null,'${selected}')">＋</button>`:''}</div>${events.length?`<div class="calendar-event-list">${events.map(item=>`<article class="calendar-event"><div class="calendar-event-time">${esc(calendarTime(item))}</div><div class="calendar-event-copy"><h3>${esc(item.title)}</h3>${item.location?`<p class="small">📍 ${esc(item.location)}</p>`:''}${item.notes?`<p>${esc(item.notes)}</p>`:''}</div>${canEdit?`<div class="calendar-event-actions"><button class="text-button" onclick="openCalendarEventForm(${jsArg(item.id)})">Edit</button><button class="text-button danger" onclick="removeCalendarEvent(${jsArg(item.id)})">Remove</button></div>`:''}</article>`).join('')}</div>`:`<p class="empty">Nothing planned for this day.${canEdit?' Add an event whenever you’re ready.':''}</p>`}</aside></section>`;
}
function openCalendarEventForm(id=null,date=state.calendarDate||scheduleDay()){
  const event=(state.familyCalendar||[]).find(item=>item.id===id)||{title:'',date,start:'',end:'',location:'',notes:''};
  openDialog('calendar-event',`<h2>${id?'Edit':'Add'} calendar event</h2><form onsubmit="saveCalendarEvent(event,${jsArg(id)})"><label>Event name<input name="title" maxlength="160" value="${esc(event.title)}" required autofocus></label><label>Date<input name="date" type="date" value="${esc(event.date||date)}" required></label><div class="settings-grid"><label>Start time <span class="small">Optional for all-day events</span><input name="start" type="time" value="${esc(event.start||'')}"></label><label>End time <span class="small">Optional</span><input name="end" type="time" value="${esc(event.end||'')}"></label></div><label>Location <span class="small">Optional</span><input name="location" maxlength="160" value="${esc(event.location||'')}"></label><label>Notes <span class="small">Optional</span><textarea name="notes" maxlength="2000">${esc(event.notes||'')}</textarea></label><p class="form-error" id="calendar-event-error" role="alert"></p><button class="button" type="submit">${id?'Save changes':'Add event'}</button></form>`);
}
function saveCalendarEvent(event,id){
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),start=String(data.get('start')||''),end=String(data.get('end')||''),error=document.getElementById('calendar-event-error');
  if(start&&end&&end<=start){error.textContent='The end time must be after the start time.';return;}
  const item={id:id||crypto.randomUUID?.()||`event-${Date.now()}-${Math.random().toString(36).slice(2)}`,title:String(data.get('title')||'').trim(),date:String(data.get('date')||''),start,end,location:String(data.get('location')||'').trim(),notes:String(data.get('notes')||'').trim()};
  if(!item.title||!item.date){error.textContent='Add an event name and date.';return;}
  const list=state.familyCalendar||[],index=list.findIndex(row=>row.id===id);if(index>=0)list[index]=item;else list.push(item);state.familyCalendar=list;state.calendarDate=item.date;state.calendarMonth=item.date.slice(0,7);queuedWrite({calendarOnly:true,events:list},'Calendar');closeDialog();render();showToast(id?'Calendar event updated':'Calendar event added');
}
function removeCalendarEvent(id){const item=(state.familyCalendar||[]).find(row=>row.id===id);if(!item)return;openDialog('calendar-delete',`<h2>Remove this event?</h2><p>${esc(item.title)} · ${esc(dateLabel(item.date))}</p><div class="actions"><button class="button light" onclick="closeDialog()">Keep event</button><button class="button danger-button" onclick="confirmRemoveCalendarEvent(${jsArg(id)})">Remove event</button></div>`);}
function confirmRemoveCalendarEvent(id){state.familyCalendar=(state.familyCalendar||[]).filter(item=>item.id!==id);queuedWrite({calendarOnly:true,events:state.familyCalendar},'Calendar');closeDialog();render();showToast('Calendar event removed');}
function updateWorkOverflow(){for(const list of document.querySelectorAll('.work-board .due-list')){const section=list.closest('.work-section'),tasks=[...list.querySelectorAll('.subject-group[open] .task')];if(!section.open||tasks.length<=2){list.style.maxHeight='';list.style.overflowY='';section.classList.remove('has-more-work');continue;}const height=Math.ceil(tasks[1].getBoundingClientRect().bottom-list.getBoundingClientRect().top+list.scrollTop);list.style.maxHeight=`${height}px`;list.style.overflowY='auto';section.classList.add('has-more-work');}}
window.addEventListener('resize',updateWorkOverflow);
document.fonts.ready.then(updateWorkOverflow);
function editor(){render();}
function monitorPage(){state.view='monitor';render();}
function acceptAuth(data,session){
  const nextView=session.role==='monitor'?'monitor':session.role==='parent'?'parent':session.role,subjectView=state.view===nextView?state.subjectView:null;
  state.assignments=dbData(data.assignments);loadSchedules(data.schedules);loadCards(data.cards);state.familyCalendar=Array.isArray(data.calendar)?data.calendar:[];
  state.rewards=data.rewards||{items:[],history:[],balances:{}};state.preferences=data.preferences||{};state.assignmentSubjectCatalogs={leon:{added:[],hidden:[]},logan:{added:[],hidden:[]},...(data.assignmentSubjectCatalogs||{})};state.auth=session;state.syncPhase='saved';state.syncError='';state.liveSyncError='';state.view=nextView;
  state.subjectView=subjectView;state.sharedSnapshot=JSON.stringify(data);state.loadError='';state.pending=localRead('school-pending-'+session.role,[]).filter(item=>item&&item.body&&typeof item.label==='string');
  // Replay unsaved edits into the fetched snapshot so a reload does not hide them.
  for(const item of state.pending){const c=item.body.change;if(c){const found=findTask(c.id);if(c.type==='add'&&!found)(state.assignments[c.student][c.subject]??=[]).push({...c});else if(c.type==='remove'&&found)state.assignments[found.student][found.subject].splice(found.index,1);else if(found){const previous=found.subject;Object.assign(found.x,c);if(c.subject&&c.subject!==previous){state.assignments[found.student][previous].splice(found.index,1);(state.assignments[found.student][c.subject]??=[]).push(found.x);}}}if(item.body.preferencesOnly)state.preferences[item.body.scope]=item.body.preferences;if(item.body.subjectsOnly)state.assignmentSubjectCatalogs[item.body.student]=item.body.catalog;if(item.body.scheduleOnly){const {student,date,items}=item.body;(state.scheduledDays[student]??={})[date]=copySchedule(items);if(state.scheduleDates[student]===date)state.schedules[student]=copySchedule(items)}if(item.body.cardsOnly)loadCards(item.body.cards);if(item.body.calendarOnly)state.familyCalendar=item.body.events;}
  localWrite(sessionKey,session);render();if(state.pending.length)pumpWrites();
}
async function fetchAuth(session){const r=await fetch('/api/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(session)});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'Sign-in failed.'),{status:r.status});return data;}
async function restoreSession(){
  const session=localRead(sessionKey,null);if(!session||!['leon','logan','parent','monitor'].includes(session.role)){render();return;}
  try{acceptAuth(await fetchAuth(session),session);}catch(error){if(error.status===401)localStorage.removeItem(sessionKey);state.loadError=error.status===401?'Please sign in again.':'Couldn’t connect. Your saved session is still available; retry when you’re online.';render();}
}
function signIn(role){
  openDialog('sign-in',`<p class="small">${role==='parent'?'Parent workspace':nameOf(role)+'’s dashboard'}</p><h2>Sign in</h2><form id="sign-in-form" onsubmit="submitSignIn(event,${jsArg(role)})"><label>Password<input name="password" type="password" autocomplete="current-password" required autofocus></label><p class="form-error" id="sign-in-error" role="alert"></p><button class="button" type="submit">Sign in</button></form>`);
}
async function submitSignIn(event,role){
  event.preventDefault();const form=event.target,button=form.querySelector('button'),session={role,password:new FormData(form).get('password')};button.disabled=true;button.textContent='Signing in…';
  try{const data=await fetchAuth(session);closeDialog();acceptAuth(data,session);}catch(error){document.getElementById('sign-in-error').textContent=error.status?error.message:'Couldn’t connect. Please try again.';button.disabled=false;button.textContent='Sign in';}
}
async function openMonitor(){
  if(state.auth?.role==='parent'){
    state.parentReturnSession={...state.auth};state.view='monitor';render();return;
  }
  try{acceptAuth(await fetchAuth({role:'monitor'}),{role:'monitor'});state.parentReturnSession=null;render();}
  catch(error){state.loadError=error.status?error.message:'Couldn’t open the dashboard. Please try again.';render();}
}
async function closeMonitor(){
  if(state.auth?.role==='parent'){
    state.parentReturnSession=null;state.view='parent';render();return;
  }
  const parentSession=state.parentReturnSession;state.parentReturnSession=null;
  if(!parentSession){goHome();return;}
  try{acceptAuth(await fetchAuth(parentSession),parentSession);}
  catch{state.parentReturnSession=parentSession;showToast('Couldn’t return to the parent dashboard. Please retry.');}
}
function goHome(){
  if(pumping||state.pending.length){openDialog('pending-sign-out','<h2>Changes are still waiting to save</h2><p>Save or retry your changes before switching profiles. This keeps your work with the correct account.</p><button class="button" onclick="retryWrites();closeDialog()">Retry saving</button>');return;}
  closeDialog();localStorage.removeItem(sessionKey);state.view=null;state.auth=null;state.subjectView=null;state.preferences={};state.loadError='';render();
}

function persistQueue(){if(state.auth)localWrite('school-pending-'+state.auth.role,state.pending);}
function updateSyncStatus(){
  const node=document.getElementById('sync-status');node.hidden=!state.auth||state.syncPhase!=='failed'&&!state.pending.length&&!state.liveSyncError;
  node.className=state.liveSyncError&&!state.pending.length&&state.syncPhase!=='failed'?'failed':state.syncPhase;
  node.innerHTML=state.syncPhase==='failed'?`<span>Couldn’t save · ${esc(state.syncError)}</span><button class="text-button" onclick="retryWrites()">Retry</button>`:state.pending.length?`<span>Saving ${state.pending.length>1?state.pending.length+' changes':'changes'}…</span>`:state.liveSyncError?`<span>Couldn’t check for updates</span><button class="text-button" onclick="refreshDashboard()">Retry</button>`:'';
}
function showSaveStatus(message,failed=false){if(failed){state.syncPhase='failed';state.syncError=message;updateSyncStatus();}else showToast(message);}
function queuedWrite(body,label){
  if(!state.auth||state.auth.role==='monitor')return Promise.resolve(false);
  const {role,password,view,...payload}=body;
  state.pending.push({body:JSON.parse(JSON.stringify(payload)),label});persistQueue();updateSyncStatus();
  return pumpWrites();
}
function pumpWrites(){
  if(pumping)return pumpPromise||Promise.resolve(false);
  if(state.syncPhase==='failed')return Promise.resolve(false);
  pumping=true;state.syncPhase='saving';updateSyncStatus();
  pumpPromise=(async()=>{
    try{
      while(state.pending.length){
        const item=state.pending[0];
        const r=await fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...item.body,role:state.auth.role,password:state.auth.password})});
        if(!r.ok){const data=await r.json().catch(()=>({}));throw Error(data.error||'Please retry when connected.');}
        const saved=await r.json();if(saved.rewards){state.rewards=saved.rewards;updatePointBalances();}
        state.pending.shift();persistQueue();state.liveSyncError='';updateSyncStatus();
      }
      state.syncPhase='saved';state.syncError='';return true;
    }catch(error){state.syncPhase='failed';state.syncError=error.message==='Failed to fetch'?'Connection unavailable.':error.message;return false;}
    finally{pumping=false;updateSyncStatus();pumpPromise=null;}
  })();
  return pumpPromise;
}
function retryWrites(){state.syncPhase='saved';return pumpWrites();}
window.addEventListener('online',()=>{if(state.pending.length)retryWrites();});
window.addEventListener('beforeunload',event=>{if(state.pending.length){event.preventDefault();event.returnValue='';}});
function saveAssignmentChange(type,found){
  const x=found.x,change={type,student:found.student,subject:found.subject,id:x.id,title:x.title,due:x.due,done:x.done,url:x.url||'',needsHelp:!!x.needsHelp,completedDate:x.completedDate||'',submittedDate:x.submittedDate||'',receiptUrl:x.receiptUrl||'',receiptNote:x.receiptNote||''};
  if(type==='status'){delete change.title;delete change.due;delete change.subject;delete change.url;}
  return queuedWrite({change},'Assignment');
}
function saveScheduleChanges(student=state.editorStudent||'leon',date=state.scheduleDates[student]||scheduleDay()){
  return queuedWrite({student,date,items:copySchedule(state.scheduledDays[student]?.[date]||[]),scheduleOnly:true},'Schedule');
}
function toggleTask(id,done,checkbox){
  const found=findTask(id);if(!found)return;
  if(done&&['leon','logan'].includes(state.auth?.role)){
    if(checkbox)checkbox.checked=false;
    openDialog('complete-assignment',`<h2>Mark this assignment complete?</h2><p>${esc(found.x.title)}</p><p class="small">Are you ready to mark this assignment as done?</p><div class="actions"><button class="button light" onclick="closeDialog()">Keep working</button><button class="button" onclick="confirmCompleteTask(${jsArg(id)})">Yes, mark complete</button></div>`);return;
  }
  saveTaskStatus(found,done);
}
function confirmCompleteTask(id){const found=findTask(id);closeDialog();if(found)saveTaskStatus(found,true);}
async function saveTaskStatus(found,done){
  const id=found.x.id;
  const previous={done:found.x.done,needsHelp:found.x.needsHelp,completedDate:found.x.completedDate||'',submittedDate:found.x.submittedDate||''};found.x.done=done;if(done){found.x.completedDate=scheduleDay();found.x.needsHelp=false;}
  const saved=saveAssignmentChange('status',found);render();
  if(await saved)showToast(done?'Assignment completed and saved':'Assignment reopened and saved',()=>{const current=findTask(id);if(!current)return;Object.assign(current.x,previous);saveAssignmentChange('status',current);render();});
}
async function markSubmitted(id){const found=findTask(id);if(!found||!found.x.done||found.x.submittedDate)return;found.x.submittedDate=scheduleDay();const saved=saveAssignmentChange('status',found);render();if(await saved)showToast('Submission date saved');}
function toggleHelp(id){const found=findTask(id);if(!found||found.x.done)return;found.x.needsHelp=!found.x.needsHelp;saveAssignmentChange('status',found);render();showToast(found.x.needsHelp?'Help request added for your parent':'Help request cleared');}
function showToast(message,undo=null){const node=document.getElementById('toast');undoAction=undo;node.hidden=false;node.innerHTML=`<span>${esc(message)}</span>${undo?'<button class="text-button" onclick="undoToast()">Undo</button>':''}<button class="text-button" aria-label="Dismiss message" onclick="document.getElementById('toast').hidden=true">×</button>`;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>{node.hidden=true;undoAction=null;},10000);}
function undoToast(){const action=undoAction;undoAction=null;document.getElementById('toast').hidden=true;if(action)action();}

function openDialog(id,content){
  const returnFocus=document.activeElement;closeDialog(true);const dialog=document.createElement('dialog');dialog.id='app-dialog';dialog.dataset.dialog=id;
  dialog.innerHTML=`<div class="dialog-top"><button class="button light" onclick="closeDialog()" aria-label="Close dialog">Close</button></div>${content}`;
  dialog.addEventListener('close',()=>{dialog.remove();if(!document.getElementById('app-dialog')){if(returnFocus?.isConnected&&!returnFocus.closest('dialog'))returnFocus.focus({preventScroll:true});else app.focus({preventScroll:true});}});dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});document.body.append(dialog);dialog.showModal();dialog.querySelector('[autofocus],input,select')?.focus();
}
function closeDialog(replacing=false){
  document.getElementById('font-preview-dialog')?.close();
  const dialog=document.getElementById('app-dialog'),id=dialog?.dataset.dialog,refreshSlots=id==='schedule';
  dialog?.close();dialog?.remove();
  if(!replacing&&id==='store-unlock-confirm'){drawUnlockCatalog(state.rewardCatalog);return;}
  if(!replacing&&id==='store-unlocks')state.rewardCatalog=null;
  if(!replacing&&id==='assignments')state.assignmentPopup=false;
  if(refreshSlots){ensureAssignmentSlots();render();}
  if(!replacing&&id&&id!=='assignments'&&state.assignmentPopup&&state.view==='parent')openAssignmentEditor();
}
function setFontEnabled(id,enabled){
  if(state.auth?.role!=='parent'||!FONT_STYLE_IDS.includes(id)||id==='theme')return;
  const p=prefs(state.settingsScope),allowed=new Set(p.allowedFonts);
  if(enabled)allowed.add(id);else allowed.delete(id);
  setPreference('allowedFonts',[...allowed],state.settingsScope);
}
function openFontPreview(forScope=scope()){
  if(state.auth?.role!=='parent')return;
  state.settingsScope=forScope;
  const p=prefs(forScope),select=document.createElement('select');
  select.innerHTML=clockFontOptions({...p,allowedFonts:FONT_STYLE_IDS,decorativeFonts:true});
  const families={'emotion-engine':'Emotion Engine','isaacsans':'IsaacSans','modern-fantasy':'Modern Fantasy','gbboot':'GB Boot','warioland4':'Wario Land 4','ci-gamedev':'CI Gamedev','tbj-margin':'TBJ Margin','system':'Consolas'};
  const samples=[...select.options].filter(option=>!['theme','system'].includes(option.value)).map(option=>{
    const family=families[option.value]||option.textContent;
    return `<article class="font-preview-card"><label class="switch"><input type="checkbox" ${p.allowedFonts.includes(option.value)?'checked':''} onchange="setFontEnabled('${option.value}',this.checked)"><span>${esc(option.textContent)}</span></label><p style="font-family:'${esc(family)}',sans-serif!important">Working Ahead · Read a chapter today.</p><p style="font-family:'${esc(family)}',sans-serif!important">Math at 9:30 AM · 0123456789</p></article>`;
  }).join('');
  openDialog('font-manager',`<link rel="stylesheet" href="assets/optional-fonts/fonts.css"><button class="button light" onclick="drawSettings()">Back to settings</button><h2>Manage fonts</h2><p>Choose which fonts ${esc(forScope==='parent'?'Parent':forScope==='monitor'?'Shared dashboard':nameOf(forScope))} can use. Changes save automatically. Unchecked fonts stay out of text, clock, and theme font choices.</p><div class="font-preview-grid">${samples}</div>`);
}
function openSettings(){
  state.settingsScope=scope();drawSettings();
}
const LOOK_PRESETS=[
  {id:'book',label:'Book',note:'Warm paper · novel serif',theme:'book',style:'book'},
  {id:'gameboy',label:'Game Boy',note:'Handheld green · pixels',theme:'gameboy',style:'pixel'},
  {id:'nes',label:'NES Classic',note:'8-bit color · pixels',theme:'nes',style:'pixel'},
  {id:'snes',label:'Super Nintendo',note:'Soft violet · pixels',theme:'snes',style:'pixel'},
  {id:'genesis',label:'Sega Genesis',note:'Blue night · retro',theme:'genesis',style:'retro'},
  {id:'arcade',label:'Arcade',note:'Neon cabinet · pixels',theme:'arcade',style:'pixel'},
  {id:'comic',label:'Comic Book',note:'Ink outlines · bright paper',theme:'comic-book',style:'comic'},
  {id:'chalkboard',label:'Chalkboard',note:'Green board · retro type',theme:'chalkboard',style:'retro'},
  {id:'pastel',label:'Pastel Pop',note:'Lavender · playful cards',theme:'pastel-pop',style:'playful'},
  {id:'sakura',label:'Sakura Paper',note:'Blush paper · soft edges',theme:'sakura-paper',style:'studio'},
  {id:'ps1',label:'PlayStation (PS1)',note:'Cool gray · retro panels',theme:'playstation',style:'retro',group:'console'},
  {id:'ps2',label:'PlayStation 2',note:'Indigo glow · console UI',theme:'ps2',style:'ps2-ui',group:'console'},
  {id:'ps4',label:'PlayStation 4',note:'Blue glow · tile UI',theme:'ps4',style:'ps4-ui',group:'console'},
  {id:'psp',label:'PSP',note:'Portable blue · pixels',theme:'psp',style:'pixel',group:'console'},
  {id:'gba',label:'Game Boy Advance',note:'Violet · pixels',theme:'gba',style:'pixel',group:'console'},
  {id:'gbc',label:'Game Boy Color',note:'Classic green · pixels',theme:'gbc',style:'pixel',group:'console'},
  {id:'n64',label:'Nintendo 64',note:'Soft violet · pixels',theme:'n64',style:'pixel',group:'console'},
  {id:'wii',label:'Wii',note:'Clean aqua · studio',theme:'wii',style:'studio',group:'console'},
  {id:'gamecube',label:'GameCube',note:'Indigo · pixels',theme:'gamecube',style:'pixel',group:'console'},
  {id:'dreamcast',label:'Dreamcast',note:'Warm gray · studio',theme:'dreamcast',style:'studio',group:'console'},
  {id:'xbox',label:'Original Xbox',note:'Deep green · pixels',theme:'xbox',style:'pixel',group:'console'},
  {id:'saturn',label:'Sega Saturn',note:'Silver · retro panels',theme:'saturn',style:'retro',group:'console'},
  {id:'ds',label:'Nintendo DS',note:'Pocket blue · pixels',theme:'ds',style:'pixel',group:'console'},
  {id:'wow-alliance',label:'WoW Alliance',note:'Gold and steel · fantasy UI',theme:'wow-alliance',style:'wow-ui',group:'game'},
  {id:'wow-horde',label:'WoW Horde',note:'Horde red · fantasy UI',theme:'wow-horde',style:'wow-ui',group:'game'},
  {id:'cuphead',label:'Cuphead',note:'Vintage cartoon · comic',theme:'cuphead',style:'comic',group:'game'},
  {id:'star-wars-sith',label:'Star Wars Sith',note:'Sith red · retro',theme:'star-wars-sith',style:'retro',group:'game'},
  {id:'star-wars-jedi',label:'Star Wars Jedi',note:'Jedi green · studio',theme:'star-wars-jedi',style:'studio',group:'game'},
  {id:'star-wars',label:'Star Wars',note:'Galactic night · retro',theme:'star-wars',style:'swtor',group:'game'},
  {id:'swtor',label:'SWTOR',note:'Cyan holo panels · sci-fi UI',theme:'swtor',style:'swtor',group:'game'},
  {id:'legend-of-dragoon',label:'Legend of Dragoon',note:'Parchment · RPG status cards',theme:'legend-of-dragoon',style:'dragoon',group:'game'},
  {id:'sims',label:'The Sims',note:'Plumbob blue · playful',theme:'sims',style:'playful',group:'game'},
  {id:'stardew-valley',label:'Stardew Valley',note:'Wood and parchment · pixel farm',theme:'stardew-valley',style:'stardew',group:'game'},
  {id:'binding-of-isaac',label:'The Binding of Isaac',note:'Scrap paper · inked cards',theme:'binding-of-isaac',style:'isaac',group:'game'},
  {id:'pipboy',label:'Fallout Pip-Boy',note:'Green CRT · terminal UI',theme:'pipboy',style:'pipboy',group:'game'}
];
function lookChoices(p,group='featured'){return LOOK_PRESETS.filter(look=>(look.group||'featured')===group).map(look=>{const palette=THEME_PALETTES[look.theme],selected=activeTheme(p)===look.theme&&p.visualStyle===look.style;return `<button type="button" class="look-choice" data-look-choice="${look.id}" aria-pressed="${selected}" onclick="applyLookPreset('${look.id}',state.settingsScope)"><span class="look-swatch" style="--look-page:${palette[2]};--look-accent:${palette[1]}"><i></i><b></b><em></em></span><span><strong>${look.label}</strong><small>${look.note} · ${themeLockLabel(look.theme)}${cosmeticOwned('visualStyle',look.style)?'':' · 🔒 UI 5 points'}</small></span></button>`;}).join('');}
function themeChoices(p,keys){const active=activeTheme(p);return keys.map(key=>{const palette=THEME_PALETTES[key],[label,accent,bg,,,line]=palette,isDark=DARK_THEME_KEYS.includes(key);return `<button type="button" class="theme-swatch" data-theme-choice="${key}" data-theme-label="${esc(label.toLowerCase())}" aria-label="Use ${esc(label)} ${isDark?'dark':'light'} palette" aria-pressed="${active===key}" onclick="selectTheme('${key}',state.settingsScope)"><span class="swatch" style="--swatch-page:${bg};--swatch-accent:${accent};--swatch-mid:${palette[4]||bg};--swatch-line:${line||accent}"><i></i><i></i><i></i></span><span>${label}<small>${isDark?'Dark':'Light'} · ${themeLockLabel(key)}</small></span></button>`;}).join('');}
function themeLibrary(p){const consoles=['nes','gameboy','snes','genesis','atari','arcade','arcade-cyan','playstation','ps2','ps4','psp','gba','gbc','n64','wii','gamecube','dreamcast','xbox','saturn','ds'],gameWorlds=['wow-alliance','wow-horde','cuphead','star-wars-sith','star-wars-jedi','star-wars','swtor','legend-of-dragoon','sims','stardew-valley','binding-of-isaac','pipboy'],groups=[['Paper & calm',['coastal','material','facebook','paper','sand','book','sepia-story','sakura-paper','arctic']],['Nature',['forest','meadow','mint','ocean-night','emerald-night','chalkboard']],['Bright & playful',['sunset','peach','berry','rose','citrus','coral','pastel-pop','comic-book']],['Retro consoles',consoles],['Game worlds',gameWorlds],['Night palettes',DARK_THEME_KEYS.filter(key=>!['genesis','atari','arcade','arcade-cyan','chalkboard','contrast-dark','ps2','ps4','psp','xbox','wow-alliance','wow-horde','star-wars-sith','star-wars','swtor','pipboy'].includes(key))],['High contrast',['contrast','contrast-dark']]],used=new Set(groups.flatMap(([,keys])=>keys)),other=Object.keys(THEME_PALETTES).filter(key=>!used.has(key));if(other.length)groups.push(['More palettes',other]);return groups.map(([label,keys],index)=>`<details class="theme-group" data-theme-group="${index}"><summary>${label}<span class="count">${keys.length}</span></summary><div class="theme-grid">${themeChoices(p,keys)}</div></details>`).join('');}
function interfaceStyleOptions(p){return[['classic','Classic'],['boxy','Boxy'],['studio','Studio'],['playful','Playful'],['glass','Glass'],['minimal','Minimal'],['comic','Comic'],['retro','Retro'],['pixel','8-bit Console'],['book','Book · serif'],['stardew','Stardew Valley · pixel farm'],['dragoon','Legend of Dragoon · RPG'],['wow-ui','World of Warcraft · fantasy'],['isaac','Binding of Isaac · paper'],['swtor','Star Wars · sci-fi'],['ps2-ui','PlayStation 2 · glossy'],['ps4-ui','PlayStation 4 · tiles'],['pipboy','Fallout · Pip-Boy']].map(([key,label])=>`<option value="${key}" ${p.visualStyle===key?'selected':''}>${label}</option>`).join('');}
function fontStyleOptions(p){const groups=[['Theme matched',[['theme','Match current theme']]],['Readable fonts',[['charger','Charger'],['emotion-engine','Emotion Engine'],['isaacsans','IsaacSans'],['montserrat','Montserrat'],['queensides','Queensides'],['rushford-clean','Rushford Clean'],['tbj-margin','TBJ Margin Condensed']]],['Decorative fonts',[['cosmic-fantasy','Cosmic Fantasy'],['dalelands','Dalelands Uncial'],['dragoon-bold','Dragoon Bold'],['gamecuben','Gamecuben'],['gbboot','GB Boot'],['kroegbainder','Kroegbainder'],['modern-fantasy','Modern Fantasy Demo'],['pokemon-gb','Pokemon GB'],['warioland4','Wario Land 4'],...EXTRA_FONT_OPTIONS.filter(([id])=>!['montserrat','queensides','rushford-clean','tbj-margin'].includes(id))]]];return groups.map(([label,items])=>[label,items.filter(([id])=>id==='theme'||p.allowedFonts.includes(id))]).filter(([,items])=>items.length).map(([label,items])=>`<optgroup label="${label}">${items.map(([key,name])=>`<option value="${key}" ${p.fontStyle===key?'selected':''}>${name}</option>`).join('')}</optgroup>`).join('');}
function clockFontOptions(p){const options=[['theme','Match theme font'],['system','Digital monospace'],['charger','Charger'],['emotion-engine','Emotion Engine'],['isaacsans','IsaacSans'],['cosmic-fantasy','Cosmic Fantasy'],['dalelands','Dalelands Uncial'],['dragoon-bold','Dragoon Bold'],['gamecuben','Gamecuben'],['gbboot','GB Boot'],['kroegbainder','Kroegbainder'],['modern-fantasy','Modern Fantasy Demo'],['pokemon-gb','Pokemon GB'],['warioland4','Wario Land 4'],...EXTRA_FONT_OPTIONS];return options.filter(([key])=>['theme','system'].includes(key)||p.allowedFonts.includes(key)).map(([key,label])=>`<option value="${key}" ${p.clockFont===key?'selected':''}>${label}</option>`).join('');}
function applyLookPreset(id,forScope=scope()){const look=LOOK_PRESETS.find(item=>item.id===id);if(!look)return;if(!cosmeticOwned('visualStyle',look.style,forScope)){openCosmeticUnlock('visualStyle',look.style,forScope);return;}if(!themeOwned(look.theme,forScope)){openThemeUnlock(look.theme,forScope);return;}const dark=DARK_THEME_KEYS.includes(look.theme),p={...prefs(forScope),appearance:dark?'dark':'light',visualStyle:look.style,[dark?'darkTheme':'lightTheme']:look.theme};state.preferences[forScope]=p;localWrite('school-preferences-'+forScope,p);if(forScope===scope())applyPreferences();if(state.auth&&state.auth.role!=='monitor')queuedWrite({preferencesOnly:true,scope:forScope,preferences:p},'Appearance');updateAppearanceControls(p);}
function interfaceStyleLabel(value){return({classic:'Classic',boxy:'Boxy',studio:'Studio',playful:'Playful',glass:'Glass',minimal:'Minimal',comic:'Comic',retro:'Retro',pixel:'8-bit Console',book:'Book',stardew:'Stardew Valley',dragoon:'Legend of Dragoon','wow-ui':'World of Warcraft',isaac:'Binding of Isaac',swtor:'Star Wars','ps2-ui':'PlayStation 2','ps4-ui':'PlayStation 4',pipboy:'Fallout Pip-Boy'})[value]||value;}
function updateAppearanceControls(p){const active=activeTheme(p),current=`${THEME_PALETTES[active][0]} · ${interfaceStyleLabel(p.visualStyle)}`;document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===active)));document.querySelectorAll('[data-style-choice]').forEach(button=>button.setAttribute('aria-pressed',String(p.visualStyle===button.dataset.styleChoice)));document.querySelectorAll('[data-look-choice]').forEach(button=>{const look=LOOK_PRESETS.find(item=>item.id===button.dataset.lookChoice);button.setAttribute('aria-pressed',String(!!look&&look.theme===active&&look.style===p.visualStyle));});document.querySelectorAll('[data-pref]').forEach(input=>{if(Object.hasOwn(p,input.dataset.pref))input.value=p[input.dataset.pref];});document.querySelectorAll('[data-appearance-current]').forEach(label=>label.textContent=current);document.querySelectorAll('[data-avatar-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatarChoice===p.avatar)));document.querySelectorAll('[data-avatar-frame-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatarFrameChoice===p.avatarFrame)));document.querySelectorAll('[data-profile-avatar]').forEach(avatar=>{const student=avatar.dataset.profileAvatar,profile=prefs(student),frame=avatar.dataset.profileAvatarFrame||profile.avatarFrame;avatar.textContent=profileAvatarFor(student,profile);avatar.className=`profile-avatar avatar-frame-${frame}`;});document.querySelectorAll('.avatar-summary').forEach(summary=>{const student=document.querySelector('[data-avatar-choice]')?.closest('.avatar-customizer')?.dataset.student;if(student){const profile=prefs(student);summary.textContent=`${profileAvatarFor(student,profile)} · ${AVATAR_FRAMES.find(([frame])=>frame===profile.avatarFrame)?.[1]||'Circle'}`;}});const opacity=document.querySelector('[data-background-opacity]'),output=document.querySelector('[data-background-opacity-value]'),remove=document.querySelector('[data-background-remove]'),effect=document.querySelector('[data-background-effect]');if(opacity){opacity.value=p.backgroundOpacity;opacity.disabled=!p.backgroundImage;}if(output)output.textContent=`${p.backgroundOpacity}%`;if(remove)remove.disabled=!p.backgroundImage;if(effect)effect.disabled=!p.backgroundImage;}
function filterThemeLibrary(query){const term=String(query||'').trim().toLowerCase();let matches=0;document.querySelectorAll('.theme-group').forEach(group=>{const buttons=[...group.querySelectorAll('[data-theme-choice]')],shown=buttons.filter(button=>!term||button.dataset.themeLabel.includes(term));buttons.forEach(button=>button.hidden=!!term&&!shown.includes(button));group.hidden=!!term&&!shown.length;if(term&&shown.length)group.open=true;if(!term)group.open=false;matches+=shown.length;});const empty=document.getElementById('theme-search-empty');if(empty)empty.hidden=matches>0;}
function drawSettings(){
  const forScope=state.settingsScope,p=prefs(forScope),parent=state.auth?.role==='parent',opt=(value,label,current)=>`<option value="${value}" ${value===current?'selected':''}>${label}</option>`;
  const totalLooks=LOOK_PRESETS.length;
  openDialog('settings',`<h2>Settings</h2><p class="small">${state.auth?.role==='monitor'||!state.auth?'Saved on this device.':'Saved for this profile and synced across devices.'}</p>${parent?`<label>Profile<select onchange="state.settingsScope=this.value;drawSettings()">${['parent','leon','logan','monitor'].map(s=>opt(s,s==='parent'?'Parent':s==='monitor'?'Shared dashboard':nameOf(s),forScope)).join('')}</select></label>`:''}${parent?`<p><button type="button" class="button light" onclick="openFontPreview(state.settingsScope)">Manage fonts</button></p>`:''}<div class="settings-grid"><label>Color mode<select data-pref="appearance" onchange="setPreference('appearance',this.value,state.settingsScope)">${opt('system','Use device setting',p.appearance)+opt('light','Always light',p.appearance)+opt('dark','Always dark',p.appearance)}</select></label><label>Time display<select data-pref="clockFormat" onchange="setPreference('clockFormat',this.value,state.settingsScope)">${opt('12h','12-hour (3:30 PM)',p.clockFormat)+opt('24h','24-hour (15:30)',p.clockFormat)}</select></label><label>Text size<select data-pref="textSize" onchange="setPreference('textSize',this.value,state.settingsScope)">${opt('small','Small',p.textSize)+opt('standard','Standard',p.textSize)+opt('large','Large',p.textSize)+opt('extra-large','Extra large',p.textSize)}</select></label><label>Spacing<select data-pref="density" onchange="setPreference('density',this.value,state.settingsScope)">${opt('comfortable','Comfortable',p.density)+opt('compact','Compact',p.density)}</select></label><label>Motion<select data-pref="motion" onchange="setPreference('motion',this.value,state.settingsScope)">${opt('system','Use device setting',p.motion)+opt('reduced','Reduce motion',p.motion)+opt('full','Allow full motion',p.motion)}</select></label></div><section class="appearance-editor"><div class="appearance-heading"><div><h3>Appearance</h3><p class="small">Pick a matched look or adjust its pieces yourself.</p></div><span class="appearance-current" data-appearance-current>${THEME_PALETTES[activeTheme(p)][0]} · ${interfaceStyleLabel(p.visualStyle)}</span></div><details class="look-library"><summary>Preset Themes <span class="count">${totalLooks}</span></summary><p class="small">Each look pairs a color palette with a matching interface style.</p><div class="look-grid">${lookChoices(p)}</div><details class="more-look-group"><summary>More console looks <span class="count">${LOOK_PRESETS.filter(look=>look.group==='console').length}</span></summary><div class="look-grid">${lookChoices(p,'console')}</div></details><details class="more-look-group"><summary>Game worlds <span class="count">${LOOK_PRESETS.filter(look=>look.group==='game').length}</span></summary><div class="look-grid">${lookChoices(p,'game')}</div></details></details><details class="mix-settings"><summary>Colors <span class="count">Customize</span></summary><label>Interface style<select data-pref="visualStyle" onchange="setPreference('visualStyle',this.value,state.settingsScope)">${interfaceStyleOptions(p)}</select></label><label class="theme-search">Find a color theme<input type="search" placeholder="Search all themes" oninput="filterThemeLibrary(this.value)"></label><div class="theme-groups">${themeLibrary(p)}</div><p id="theme-search-empty" class="empty" hidden>No matching themes.</p><p class="small">Choose a palette independently to pair it with the selected interface style.</p></details><details class="appearance-customizer"><summary>Font, UI, background <span class="count">Customize</span></summary><p class="small">These details work with any color theme or interface style.</p><div class="customizer-grid"><label>Font<select data-pref="fontStyle" onchange="setPreference('fontStyle',this.value,state.settingsScope)">${fontStyleOptions(p)}</select></label><label>Corners<select data-pref="cornerStyle" onchange="setPreference('cornerStyle',this.value,state.settingsScope)">${opt('theme','Use interface style',p.cornerStyle)+opt('soft','Soft corners',p.cornerStyle)+opt('square','Square corners',p.cornerStyle)+opt('pill','Pill-shaped controls',p.cornerStyle)}</select></label><label>Edges<select data-pref="edgeStyle" onchange="setPreference('edgeStyle',this.value,state.settingsScope)">${opt('theme','Use interface style',p.edgeStyle)+opt('plain','Plain',p.edgeStyle)+opt('outlined','Outlined',p.edgeStyle)+opt('bold','Bold',p.edgeStyle)+opt('dashed','Dashed',p.edgeStyle)+opt('glow','Glow',p.edgeStyle)}</select></label><label>Surface texture<select data-pref="surfaceTexture" onchange="setPreference('surfaceTexture',this.value,state.settingsScope)">${opt('none','None',p.surfaceTexture)+opt('paper','Paper grain',p.surfaceTexture)+opt('grid','Pixel grid',p.surfaceTexture)+opt('scanlines','CRT scanlines',p.surfaceTexture)+opt('halftone','Halftone dots',p.surfaceTexture)}</select></label></div></details></section>${['leon','logan'].includes(forScope)?`<div class="settings-grid"><label class="switch"><input type="checkbox" ${p.classBrowser?'checked':''} onchange="setPreference('classBrowser',this.checked,state.settingsScope)">Show class browser on dashboard</label><label class="switch"><input type="checkbox" ${p.hideCompleted?'checked':''} onchange="setPreference('hideCompleted',this.checked,state.settingsScope)">Hide completed in class lists</label></div>`:''}<p class="small">Themes change colors; interface styles change shapes and typography. Subject and assignment status colors stay consistent.</p>`);
  const timeDisplay=document.querySelector('#app-dialog [data-pref="clockFormat"]')?.closest('label');timeDisplay?.insertAdjacentHTML('afterend',`<label>Clock font<select data-pref="clockFont" onchange="setPreference('clockFont',this.value,state.settingsScope)">${clockFontOptions(p)}</select></label>`);
  if(['leon','logan'].includes(forScope)){const customizer=document.querySelector('#app-dialog .appearance-customizer');customizer?.insertAdjacentHTML('beforebegin',avatarCustomizer(p,forScope));const section=document.querySelector('#app-dialog .avatar-customizer');if(section)section.dataset.student=forScope;}
  document.querySelector('#app-dialog .appearance-customizer .customizer-grid')?.insertAdjacentHTML('afterend',`<div class="custom-background-controls"><div class="custom-background-picker"><label>Custom background image<input type="file" accept="image/*" onchange="setCustomBackground(this)"><small>Choose an image from this device. It is resized and saved with this profile.</small></label><button class="text-button danger" type="button" data-background-remove ${p.backgroundImage?'':'disabled'} onclick="clearCustomBackground(state.settingsScope)">Remove image</button></div><label class="background-opacity-control">Image opacity <output data-background-opacity-value>${p.backgroundOpacity}%</output><input type="range" min="0" max="35" step="1" value="${p.backgroundOpacity}" data-background-opacity ${p.backgroundImage?'':'disabled'} oninput="previewCustomBackgroundOpacity(this.value,state.settingsScope)" onchange="setPreference('backgroundOpacity',Number(this.value),state.settingsScope)"><small>From hidden to lightly visible. Dark mode layers over black; light mode layers over white. Maximum opacity is 35%.</small></label></div>`);
  document.querySelector('#app-dialog .custom-background-controls')?.insertAdjacentHTML('afterbegin',`<label class="background-effect-control">Background effect<select data-pref="backgroundEffect" data-background-effect ${p.backgroundImage?'':'disabled'} onchange="setPreference('backgroundEffect',this.value,state.settingsScope)">${opt('none','None',p.backgroundEffect)+opt('scanlines','CRT scanlines',p.backgroundEffect)+opt('grid','Pixel grid',p.backgroundEffect)+opt('paper','Paper grain',p.backgroundEffect)+opt('halftone','Halftone dots',p.backgroundEffect)}</select><small>Apply a texture directly to the background image.</small></label>`);
  if(parent&&forScope==='parent')document.getElementById('app-dialog').insertAdjacentHTML('beforeend','<button class="button light" onclick="openPasswordSettings()">Change parent password</button>');
  if(parent&&['leon','logan','monitor'].includes(forScope))document.getElementById('app-dialog').insertAdjacentHTML('beforeend',`<label class="switch dashboard-detail-setting"><input type="checkbox" ${p.dashboardExpanded?'checked':''} onchange="setPreference('dashboardExpanded',this.checked,state.settingsScope)">Start dashboard with all details expanded</label>`);
  labelCosmeticPrices();
  organizeSettings();
  document.querySelector('[data-settings-section="general"]')?.insertAdjacentHTML('beforeend',`<div class="settings-tools"><button class="button light" onclick="openResources()">School Resources</button>${state.auth?.role==='parent'?'<button class="button light" onclick="downloadBackup()">Download backup</button>':''}</div>`);
}
function showSettingsSection(section){
  state.settingsSection=section;
  document.querySelectorAll('[data-settings-section]').forEach(panel=>panel.hidden=panel.dataset.settingsSection!==section);
  document.querySelectorAll('[data-settings-nav]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.settingsNav===section)));
}
function organizeSettings(){
  const dialog=document.getElementById('app-dialog'),appearance=dialog.querySelector('.appearance-editor');
  const nav=document.createElement('nav');nav.className='settings-nav';nav.setAttribute('aria-label','Settings categories');
  nav.innerHTML=['General','Appearance'].map(label=>`<button type="button" class="text-button" data-settings-nav="${label.toLowerCase()}" onclick="showSettingsSection('${label.toLowerCase()}')">${label}</button>`).join('');
  const general=document.createElement('section'),looks=document.createElement('section');
  general.dataset.settingsSection='general';looks.dataset.settingsSection='appearance';
  const fontButton=dialog.querySelector('[onclick="openFontPreview(state.settingsScope)"]')?.closest('p');
  const start=dialog.querySelector(':scope>.settings-grid');
  const nodes=[...dialog.children].slice([...dialog.children].indexOf(start));
  dialog.insertBefore(nav,fontButton||start);dialog.append(general,looks);
  if(fontButton)looks.append(fontButton);
  for(const node of nodes){if(node===appearance||node.tagName==='P')looks.append(node);else general.append(node);}
  showSettingsSection(state.settingsSection||'general');
}
function helpInboxButton(count,selected){
  return `<button class="button light inbox-button" aria-label="Help inbox, ${count} pending requests" title="Help inbox" aria-current="${selected?'page':'false'}" onclick="setParentTab('help')"><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16l2 12v4H2v-4L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/></svg><span class="inbox-count ${count?'has-requests':''}">${count}</span></button>`;
}
function openPasswordSettings(){openDialog('password',`<h2>Change parent password</h2><form onsubmit="changeParentPassword(event)"><label>Current password<input name="current" type="password" autocomplete="current-password" required></label><label>New password<input name="next" type="password" autocomplete="new-password" minlength="4" required></label><label>Confirm new password<input name="confirm" type="password" autocomplete="new-password" minlength="4" required></label><p id="password-error" class="form-error" role="alert"></p><button class="button" type="submit">Save password</button></form>`);}
async function changeParentPassword(event){
  event.preventDefault();const form=event.target,data=new FormData(form),error=document.getElementById('password-error'),button=form.querySelector('button');
  if(data.get('next')!==data.get('confirm')){error.textContent='The new passwords do not match.';return;}
  if(state.pending.length||pumping){error.textContent='Save or retry your pending changes first.';return;}
  button.disabled=true;
  try{
    const response=await fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role:'parent',password:data.get('current'),passwordOnly:true,nextPassword:data.get('next')})});
    if(!response.ok){const result=await response.json();throw Error(response.status===401?'Check your current password.':result.error||'Couldn’t change the password.');}
    state.auth.password=data.get('next');localWrite(sessionKey,state.auth);closeDialog();showToast('Parent password updated');
  }catch(problem){error.textContent=problem.message;button.disabled=false;}
}

function setParentTab(tab){if(tab==='assignments'){openAssignmentEditor();return;}state.parentTab=tab;render();}
function openAssignmentEditor(){if(state.auth?.role!=='parent')return;state.assignmentPopup=true;openDialog('assignments',`<h2>Assignments</h2><div class="assignment-popout-body">${assignmentEditor()}</div>`);}
function parentPage(){
  const helpCount=['leon','logan'].flatMap(student=>allTasks(student)).filter(x=>!x.done&&x.needsHelp).length;
  return mast()+`<section class="page-heading"><div><p class="small">Family workspace</p><h1>Parent dashboard</h1></div></section><nav class="parent-tabs" aria-label="Parent workspace"><button class="button light" onclick="openFamilyEditorChooser('schedule')">Edit schedule</button><button class="button light" onclick="openFamilyEditorChooser('reminders')">Announcements &amp; reminders</button><button class="button light" onclick="openMonitor()">Shared dashboard</button><button class="button" onclick="openAssignmentEditor()" aria-haspopup="dialog">Assignments</button>${helpInboxButton(helpCount,state.parentTab==='help')}</nav>`+parentSchedules()+(state.parentTab==='help'?helpInbox():'');
}
function childDashboardBar(student){
  const rows=allTasks(student),today=scheduleDay(),due=rows.filter(x=>!x.done&&x.due===today).length,late=rows.filter(x=>!x.done&&x.due&&x.due<today).length,help=rows.filter(x=>!x.done&&x.needsHelp).length;
  return `<header class="child-dashboard-bar"><h3 class="child-label">${profileAvatarMark(student)}<span>${nameOf(student)}</span></h3><div class="child-dashboard-controls"><div class="child-work-counts"><span>Due today <b>${due}</b></span><span>Past due <b>${late}</b></span><button class="text-button child-help-notification ${help?'has-requests':''}" onclick="openChildHelp('${student}')" aria-label="${nameOf(student)} help requests, ${help} pending"><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16l2 12v4H2v-4L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/></svg>Help <b>${help}</b></button><span>⭐ <b data-point-balance="${student}">${state.rewards?.balances?.[student]??0}</b> points</span></div><div class="actions"><button class="button light" onclick="editStudent('${student}')">Assignments</button><button class="button light" onclick="openScheduleFor('${student}')">Edit schedule</button><button class="button light" onclick="openPointAward('${student}')">Award points</button></div></div></header>`;
}
function parentSchedules(){
  return `<section class="panel parent-schedules"><div class="section-heading"><h2>Kids’ schedules</h2><span class="small">${dateLabel(scheduleDay())} · Eastern Time</span></div><p class="small">Optional sessions are available if you need extra help.</p><div class="week-students">${['leon','logan'].map(student=>{const items=scheduleFor(student).sort((a,b)=>scheduleMinutes(a.time)-scheduleMinutes(b.time));return `<section class="week-student ${student}">${childDashboardBar(student)}<details open><summary>Today’s schedule <span class="count">${items.length}</span></summary>${items.length?`<div class="schedule-list">${items.map(item=>`<div class="schedule-item" style="${scheduleItemStyle(item)}"><span>${esc(scheduleLabel(item,student))}</span><time>${formatScheduleTime(item.time)}${item.endTime?' – '+formatScheduleTime(item.endTime):''}</time></div>`).join('')}</div>`:'<p class="empty">No schedule set for today.</p>'}</details><button class="text-button" onclick="previewTomorrowSchedule('${student}')">View tomorrow’s schedule →</button></section>`;}).join('')}</div></section>`;
}
function openChildHelp(student){if(state.auth?.role!=='parent')return;openDialog('child-help',`<div data-help-student="${student}">${helpInbox(student)}</div>`);}
function helpInbox(forStudent=null){
  const requests=(forStudent?[forStudent]:['leon','logan']).flatMap(student=>allTasks(student).filter(x=>!x.done&&x.needsHelp).map(x=>({...x,student}))).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  return `<section class="panel help-panel"><div class="section-heading"><h2>Needs help <span class="count">${requests.length}</span></h2><span class="small">${forStudent?'Requests from '+nameOf(forStudent):'Requests from Leon and Logan'}</span></div>${requests.length?requests.map(x=>`<article class="help-request"><div><strong>${iconOf(x.student)} ${nameOf(x.student)} · ${esc(subjectLabel(x.subject,x.student))}</strong><span>${esc(x.title)}</span><div class="task-meta">${dueChip(x)}</div></div><div class="actions">${x.url?`<a class="button light" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Open assignment ↗</a>`:''}<button class="button light" onclick="editStudent('${x.student}',${jsArg(x.subject)})">View assignment</button><button class="button" onclick="toggleHelp(${jsArg(x.id)})">Mark handled</button></div></article>`).join(''):'<p class="empty">No open help requests. New requests from the kids will appear here.</p>'}</section>`;
}
function editStudent(student,subject){state.editorStudent=student;state.editorSubject=subject||Object.keys(state.assignments[student])[0];openAssignmentEditor();}
function subjectCatalog(student){const catalog=state.assignmentSubjectCatalogs[student]||{added:[],hidden:[]};return{added:[...(catalog.added||[])],hidden:[...(catalog.hidden||[])]};}
function saveSubjectCatalog(student){const catalog=subjectCatalog(student);state.assignmentSubjectCatalogs[student]=catalog;return queuedWrite({subjectsOnly:true,student,catalog},'Subjects');}
function openSubjectManager(){
  const student=state.editorStudent||'leon',subjects=Object.keys(state.assignments[student]||{}).sort((a,b)=>subjectLabel(a,student).localeCompare(subjectLabel(b,student)));
  const list=subjects.length?subjects.map(subject=>{const count=(state.assignments[student][subject]||[]).length;return `<div class="editor-assignment"><div><strong>${esc(subjectLabel(subject,student))}</strong><span class="small">${count?`${count} assignment${count===1?'':'s'}`:'No assignments'}</span></div><button class="button light" onclick="removeAssignmentSubject('${student}',${jsArg(subject)})" ${count?'disabled title="Remove assignments before removing this subject"':''}>Remove</button></div>`;}).join(''):'<p class="empty">No subjects yet. Add one below to create an assignment slot.</p>';
  openDialog('subject-manager',`<h2>Manage ${nameOf(student)}’s subjects</h2><p class="small">Classes in ${nameOf(student)}’s saved schedule are available automatically. You can also add other subjects here.</p><div class="editor-assignments">${list}</div><form onsubmit="addAssignmentSubject(event,'${student}')"><label>New subject<input name="subject" maxlength="60" placeholder="For example, Music" required></label><p class="form-error" id="subject-error" role="alert"></p><button class="button" type="submit">Add subject</button></form>`);
}
function addAssignmentSubject(event,student){
  event.preventDefault();const label=String(new FormData(event.target).get('subject')||'').trim(),subject=scheduleAssignmentSubject({subject:'custom',label});
  if(!label||!subject||subject==='custom'){document.getElementById('subject-error').textContent='Enter a subject name with at least one letter or number.';return;}
  const catalog=subjectCatalog(student),hidden=new Set(catalog.hidden),existing=state.assignments[student][subject];
  if(existing?.length){document.getElementById('subject-error').textContent='That subject already has assignments.';return;}
  if(hidden.has(subject))catalog.hidden=catalog.hidden.filter(id=>id!==subject);
  else if(existing){document.getElementById('subject-error').textContent='That subject is already available.';return;}
  if(!catalog.added.some(item=>item.id===subject))catalog.added.push({id:subject,label});
  state.assignmentSubjectCatalogs[student]=catalog;state.assignments[student][subject]??=[];state.editorSubject=subject;saveSubjectCatalog(student);render();openSubjectManager();
}
function removeAssignmentSubject(student,subject){
  if((state.assignments[student]?.[subject]||[]).length){showToast('Remove the subject’s assignments first.');return;}
  const catalog=subjectCatalog(student),scheduled=scheduledItems(student).some(item=>scheduleAssignmentSubject(item)===subject);
  catalog.added=catalog.added.filter(item=>item.id!==subject);
  if(scheduled&&!catalog.hidden.includes(subject))catalog.hidden.push(subject);
  state.assignmentSubjectCatalogs[student]=catalog;delete state.assignments[student][subject];
  if(state.editorSubject===subject)state.editorSubject=Object.keys(state.assignments[student])[0]||'';
  saveSubjectCatalog(student);ensureAssignmentSlots();render();openSubjectManager();
}
function assignmentEditor(){
  const student=state.editorStudent||'leon',subjects=state.assignments[student],selected=subjects[state.editorSubject]?state.editorSubject:Object.keys(subjects)[0]||'';state.editorSubject=selected;
  const rows=subjects[selected]||[],shown=rows.filter(x=>!state.editorHideCompleted||!x.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  return `<section class="parent-page panel"><div class="editor-toolbar"><label>Child<select onchange="editStudent(this.value)">${['leon','logan'].map(s=>`<option value="${s}" ${s===student?'selected':''}>${nameOf(s)}</option>`).join('')}</select></label><label>Subject<select onchange="state.editorSubject=this.value;render()">${Object.keys(subjects).map(s=>`<option value="${s}" ${s===selected?'selected':''}>${esc(subjectLabel(s,student))}</option>`).join('')}</select></label><label class="switch"><input type="checkbox" ${state.editorHideCompleted?'checked':''} onchange="state.editorHideCompleted=this.checked;render()">Hide completed</label></div><p class="small">Changes save automatically to your family account.</p><div class="toolbar"><button class="button" onclick="openAssignmentForm()" ${selected?'':'disabled'}>Add assignment</button><button class="button light" onclick="openImport()" ${selected?'':'disabled'}>Import assignments</button><button class="button light" onclick="openSubjectManager()">Manage subjects</button></div><h2>${esc(subjectLabel(selected,student)||'Assignments')}</h2><div class="editor-assignments">${shown.map(x=>`<article class="editor-assignment"><div>${task(x,student)}<span class="small">${x.url?'Assignment link added':'No assignment link'}</span></div><div class="editor-actions"><button class="button light" onclick="openAssignmentForm(${jsArg(x.id)})">Edit</button><button class="text-button danger" onclick="removeTask(${jsArg(x.id)})">Remove</button></div></article>`).join('')||'<p class="empty">No assignments in this view.</p>'}</div></section>`;
}
function openAssignmentForm(id=''){
  const found=id?findTask(id):null,student=found?.student||state.editorStudent||'leon',subject=found?.subject||state.editorSubject,x=found?.x||{};
  openDialog('assignment-form',`<h2>${id?'Edit':'Add'} assignment</h2><form onsubmit="submitAssignment(event,${jsArg(id)})"><label>Title<input name="title" value="${esc(x.title||'')}" required maxlength="2000" autofocus></label><div class="settings-grid"><label>Due date<input type="date" name="due" value="${esc(x.due||'')}"></label><label>Subject<select name="subject">${Object.keys(state.assignments[student]).map(s=>`<option value="${s}" ${s===subject?'selected':''}>${esc(subjectLabel(s,student))}</option>`).join('')}</select></label><label>Completed date<input type="date" name="completedDate" value="${esc(x.completedDate||'')}"></label><label>Submitted date<input type="date" name="submittedDate" value="${esc(x.submittedDate||'')}"></label></div><label>Assignment link <span class="small">Optional</span><input type="url" name="url" value="${esc(x.url||'')}" placeholder="https://…"><small>Paste the direct link from the school site.</small></label><label>Receipt or proof link <span class="small">Optional</span><input type="url" name="receiptUrl" value="${esc(x.receiptUrl||'')}" placeholder="https://…"><small>Link to a submission confirmation, screenshot, or other receipt.</small></label><label>Receipt note <span class="small">Optional</span><textarea name="receiptNote" maxlength="2000" placeholder="Confirmation number or other details">${esc(x.receiptNote||'')}</textarea></label><p class="form-error" id="assignment-error" role="alert"></p><button class="button" type="submit">${id?'Save changes':'Add assignment'}</button></form>`);
}
function submitAssignment(event,id){
  event.preventDefault();const data=new FormData(event.target),url=String(data.get('url')||'').trim(),receiptUrl=String(data.get('receiptUrl')||'').trim(),title=String(data.get('title')).trim();
  if(!title||url&&!safeLink(url)||receiptUrl&&!safeLink(receiptUrl)){document.getElementById('assignment-error').textContent='Enter a title and complete http or https links.';return;}
  const found=id?findTask(id):null,student=found?.student||state.editorStudent||'leon',subject=data.get('subject');
  const x={...(found?.x||{id:crypto.randomUUID(),done:false,needsHelp:false}),title,due:data.get('due')||'',url:safeLink(url),completedDate:data.get('completedDate')||'',submittedDate:data.get('submittedDate')||'',receiptUrl:safeLink(receiptUrl),receiptNote:String(data.get('receiptNote')||'').trim()};
  if(found)state.assignments[student][found.subject].splice(found.index,1);
  (state.assignments[student][subject]??=[]).push(x);state.editorSubject=subject;
  saveAssignmentChange(id?'update':'add',{student,subject,x});closeDialog();render();
}
function removeTask(id){
  const found=findTask(id);if(!found)return;
  openDialog('remove-assignment',`<h2>Remove assignment?</h2><p>${esc(found.x.title)}</p><p class="small">You can undo the removal immediately afterward.</p><button class="button danger" onclick="confirmRemove(${jsArg(id)})">Remove assignment</button>`);
}
function confirmRemove(id){const found=findTask(id);if(!found)return;state.assignments[found.student][found.subject].splice(found.index,1);saveAssignmentChange('remove',found);closeDialog();render();showToast('Assignment removed',()=>{state.assignments[found.student][found.subject].push(found.x);saveAssignmentChange('add',found);render();});}
function downloadBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({assignments:state.assignments,schedules:schedulePayload(),cards:dashboardCardsPayload(),calendar:state.familyCalendar,preferences:state.preferences,rewards:state.rewards},null,2)],{type:'application/json'}));a.download='school-dashboard-backup-'+scheduleDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function sharedPage(){const readonly=state.auth?.role!=='parent';return mast()+`<section class="page-heading"><div><p class="small">${dateLabel(scheduleDay())}</p><h1>Our school day</h1></div>${dashboardClock()}</section><p id="shared-refresh-status" class="small" role="status">${esc(state.refreshError||'')}</p><div class="shared-grid">${['leon','logan'].map(student=>`<article class="shared-child"><h2 class="profile-heading">${profileAvatarMark(student)}<span>${nameOf(student)}</span></h2><div class="work-board">${workSection(state.assignments[student],'late',student,readonly)}${workSection(state.assignments[student],'today',student,readonly)}${workingAhead(state.assignments[student],student,readonly)}${optionalSessions(student)}</div>${schedulePanel(student)}</article>`).join('')}</div>`;}
async function refreshDashboard(silent=false){
  if(!state.auth||state.pending.length||pumping){if(!silent)showToast('Save your pending changes before refreshing.');return;}
  if(state.refreshing)return;state.refreshing=true;
  try{
    const auth=state.auth,data=await fetchAuth(auth);state.refreshError='';state.liveSyncError='';
    const snapshot=JSON.stringify(data);
    if(!silent||snapshot!==state.sharedSnapshot){const sharedParentView=state.view==='monitor'&&auth.role==='parent';acceptAuth(data,auth);if(sharedParentView){state.view='monitor';render();}state.sharedSnapshot=snapshot;}
    if(!silent)showToast('Dashboard refreshed');
  }catch{state.liveSyncError='Connection unavailable.';if(!silent)showToast('Couldn’t refresh. Please try again.');else state.refreshError='Connection unavailable. Showing the last loaded data.';}
  finally{state.refreshing=false;updateSyncStatus();const status=document.getElementById('shared-refresh-status');if(status)status.textContent=state.refreshError||'';}
}

function openFamilyEditorChooser(editor){
  const label=editor==='schedule'?'schedule':'announcements and reminders';
  openDialog('family-editor-chooser',`<h2>Choose whose ${label} to edit</h2><div class="class-picker">${['leon','logan'].map(student=>`<button class="button light" onclick="openFamilyEditor('${editor}','${student}')">${iconOf(student)} ${nameOf(student)}</button>`).join('')}</div>`);
}
function openFamilyEditor(editor,student){if(editor==='schedule')openScheduleFor(student);else openCardEditor(student);}
function openScheduleFor(student){state.editorStudent=student;state.scheduleDates[student]=scheduleDay();state.schedules[student]=scheduleFor(student);openScheduleEditor();}
function openScheduleEditor(){
  const student=state.editorStudent||'leon',items=state.schedules[student]||[],subjects=[...new Set([...Object.keys(state.assignments[student]),...SCHEDULE_SUBJECTS])],date=state.scheduleDates[student]||scheduleDay();
  openDialog('schedule',`<h2>${nameOf(student)}’s schedule</h2><p class="small">All times use Eastern Time. Changes stay here until you select “Save this day” or import a schedule.</p><label>Schedule date<input type="date" value="${date}" min="${scheduleDay()}" onchange="selectScheduleDate(this.value)"></label><p class="small">${esc(state.scheduleMessage||'')}</p><div class="schedule-editor">${items.map((x,i)=>`<div class="schedule-row"><label>Class<select onchange="setScheduleSubject(${i},this.value)">${[...subjects,'custom','break'].map(s=>`<option value="${s}" ${x.subject===s?'selected':''}>${esc(subjectLabel(s,student))}</option>`).join('')}</select></label><label>Label<input value="${esc(x.label||'')}" onchange="editScheduleEntry(${i},'label',this.value)" ${!['custom','break'].includes(x.subject)?'disabled':''}></label><label>Start<input type="time" value="${esc(x.time||'')}" onchange="editScheduleEntry(${i},'time',this.value)"></label><label>End <span class="small">Optional</span><input type="time" value="${esc(x.endTime||'')}" onchange="editScheduleEntry(${i},'endTime',this.value)"></label><button class="text-button danger" onclick="removeScheduleEntry(${i})">Remove</button></div>`).join('')}</div><div class="toolbar"><button class="button" onclick="addScheduleEntry()">Add class or break</button><button class="button light" onclick="openScheduleImport()">Import schedule</button><button class="button light" onclick="clearOpenSchedule()">Clear this day</button><button class="button" onclick="saveOpenSchedule()">Save this day</button></div>`);
}
function closeScheduleEditor(){closeDialog();}
function refreshScheduleEditor(){render();openScheduleEditor();}
function addScheduleEntry(){
  const student=state.editorStudent||'leon';
  (state.schedules[student]??=[]).push({type:'class',subject:Object.keys(state.assignments[student])[0]||'custom',label:'Custom event',time:'09:00',endTime:''});
  state.scheduleMessage='Unsaved changes';refreshScheduleEditor();
}
function setScheduleSubject(index,subject){
  const student=state.editorStudent||'leon',item=state.schedules[student][index];
  item.subject=subject;item.type=subject==='break'?'break':'class';
  if(subject!=='custom')item.label=subject==='break'?'Break':subjectLabel(subject,student);
  state.scheduleMessage='Unsaved changes';refreshScheduleEditor();
}
function editScheduleEntry(index,field,value){
  const student=state.editorStudent||'leon',item=state.schedules[student][index];
  item[field]=value;state.scheduleMessage='Unsaved changes';
}
function openCardEditor(student){
  const announcements=state.announcements[student]||[],items=announcements.length?`<div class="announcement-queue">${announcements.map(item=>`<article class="announcement-queue-item"><div><strong>${esc(item.title||item.message)}</strong><span class="small">${esc(announcementWhen(item))} · ${item.style==='celebration'?'🎉 Celebration':item.style==='encouragement'?'💪 Encouragement':'📣 Note'}</span>${item.title&&item.message?`<span class="small">${esc(item.message)}</span>`:''}</div><button class="button light" type="button" onclick="removeAnnouncement('${student}',${jsArg(item.id)})">Remove</button></article>`).join('')}</div>`:'<p class="empty">No announcements set.</p>',fields=`<div class="card-edit-grid">${state.displayCards[student].map((value,i)=>`<label>Quick reminder ${i+1}<input maxlength="120" value="${esc(value)}" onchange="editDisplayCard('${student}',${i},this.value)"></label>`).join('')}</div>`;
  openDialog('reminders',`<h2>Customize ${nameOf(student)}’s dashboard</h2><p class="small">Announcements appear only on this child’s dashboard. Leave the start date and time blank to show one right away. Scheduled announcements start at the chosen time and remain visible for that day.</p><h3>Announcements</h3>${items}<form class="announcement-form" onsubmit="saveAnnouncement(event,'${student}')"><h3>New announcement</h3><label>Headline<input name="title" maxlength="80" placeholder="You did it!"></label><label>Message<textarea name="message" maxlength="240" placeholder="Write a short note for ${nameOf(student)}"></textarea></label><label>Style<select name="style"><option value="celebration">🎉 Celebration with fanfare</option><option value="encouragement">💪 Encouragement</option><option value="notice">📣 Note for today</option></select></label><label>Start showing <span class="small">Optional · Eastern Time</span><input name="startsAt" type="datetime-local" min="${easternDateTimeNow()}"></label><p class="form-error" id="announcement-error" role="alert"></p><button class="button" type="submit">Save announcement</button></form><h3>Quick reminders</h3><p class="small">Changes save when you leave a field.</p>${fields}`);
}
function editDisplayCard(forScope,index,value){state.displayCards[forScope][index]=value;return queuedWrite({cards:dashboardCardsPayload(),cardsOnly:true},'Reminders');}
function saveAnnouncement(event,student){event.preventDefault();const form=event.currentTarget,title=String(form.elements.title.value||'').trim(),message=String(form.elements.message.value||'').trim(),startsAt=form.elements.startsAt.value;if(!title&&!message){document.getElementById('announcement-error').textContent='Add a headline or message.';return;}if(startsAt&&startsAt<easternDateTimeNow()){document.getElementById('announcement-error').textContent='Choose a future day and time.';return;}const list=state.announcements[student]||[];if(list.length>=30){document.getElementById('announcement-error').textContent='Remove an old announcement before adding another.';return;}list.push({id:crypto.randomUUID?.()||`announcement-${Date.now()}-${Math.random().toString(36).slice(2)}`,enabled:true,title,message,style:form.elements.style.value,startsAt});state.announcements[student]=list;queuedWrite({cards:dashboardCardsPayload(),cardsOnly:true},'Announcement');openCardEditor(student);showToast(startsAt?`${nameOf(student)}’s announcement scheduled`:`${nameOf(student)}’s announcement posted`);}
function removeAnnouncement(student,id){state.announcements[student]=(state.announcements[student]||[]).filter(item=>item.id!==id);queuedWrite({cards:dashboardCardsPayload(),cardsOnly:true},'Announcement');openCardEditor(student);showToast('Announcement removed');}

// Keep legacy school-site imports, but present them in accessible native dialogs.
const assignmentImportContent=openImport;
openImport=()=>{assignmentImportContent();const legacy=document.getElementById('import-modal');const content=legacy.querySelector('.import-box');content.querySelector('button')?.remove();const markup=content.innerHTML;legacy.remove();openDialog('assignment-import',`<div id="import-modal">${markup}</div>`);};
closeImport=()=>closeDialog();
const scheduleImportContent=openScheduleImport;
openScheduleImport=()=>{scheduleImportContent();const legacy=document.getElementById('schedule-import-modal');const content=legacy.querySelector('.import-box');content.querySelector('button')?.remove();const markup=content.innerHTML;legacy.remove();openDialog('schedule-import',`<div id="schedule-import-modal">${markup}</div>`);};
closeScheduleImport=()=>closeDialog();

function refreshVisibleSchedules(){
  const orbit=document.querySelector('.student-page-heading .class-orbit');
  if(orbit){const replacement=document.createElement('div');replacement.innerHTML=classTimeline(state.view);const next=replacement.firstElementChild,oldClock=orbit.querySelector('#dashboard-clock'),nextClock=next.querySelector('#dashboard-clock');if(oldClock&&nextClock){nextClock.dateTime=oldClock.dateTime;nextClock.textContent=oldClock.textContent;}if(orbit.innerHTML!==next.innerHTML)orbit.replaceWith(next);}
  for(const node of document.querySelectorAll('[data-schedule]')){
    const details=node.querySelector('details'),open=details?.open,student=node.dataset.schedule;
    const replacement=document.createElement('div');replacement.innerHTML=schedulePanel(student,state.view==='monitor');const next=replacement.firstElementChild;if(open)next.querySelector('details')?.setAttribute('open','');if(node.innerHTML!==next.innerHTML)node.replaceWith(next);
  }
}
setInterval(updateDashboardClock,15000);
setInterval(updateFocusTimer,1000);
setInterval(refreshVisibleSchedules,60000);
setInterval(refreshVisibleAnnouncements,15000);
setInterval(()=>{if(state.auth&&!document.hidden&&!document.getElementById('app-dialog'))refreshDashboard(true);},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisibleSchedules();});
applyPreferences();restoreSession();
