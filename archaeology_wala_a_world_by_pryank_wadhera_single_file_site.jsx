import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Moon, Sun, BookOpen, Globe2, Landmark, Compass, Mail, Share2, Bookmark, BookmarkCheck, Clock, ChevronRight, ChevronLeft, Map, Info, Grip, Flame, Layers, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Fuse from "fuse.js";

// =============================================
// ArchaeologyWala — single-file React site
// TailwindCSS for styling. Uses framer-motion, lucide-react, react-markdown, fuse.js.
// Features inspired by top sites: global search (Amazon/Google-like), sticky reading progress (NYTimes/Medium),
// article TOC + anchors (Wikipedia), hover glossary (Wikipedia), bookmarks & reading list (Pocket/Medium),
// photo story/gallery (NatGeo), learning paths (Khan Academy), tags & filters (The Verge),
// dark mode + typography controls (Medium), share/citation tools (ArXiv/Medium), newsletter (Substack-like).
// =============================================

// ---------- Sample Content (replace with your own posts later) ----------
const samplePosts = [
  {
    slug: "pottery-through-ages",
    title: "Pottery Through the Ages: From Neolithic to Classical",
    author: "Pryank Wadhera",
    date: "2025-08-21",
    hero: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1400&auto=format&fit=crop",
    tags: ["material culture", "ceramics", "field methods"],
    minutes: 9,
    body: `# Pottery Through the Ages\n\nPottery is one of the most **diagnostic** classes of artifacts in archaeology.\n\n## Neolithic beginnings\nHandmade, low-fired vessels appear with the rise of sedentism.\n\n## Form & function\nRim profiles, tempers, and surface treatments are key for *typological* studies.\n\n## Classical refinements\nWheel-thrown finewares, slips, and painted motifs enable tight **chronologies**.\n\n> Field note: Sherds dominate most survey assemblages; bring sturdy bags!\n\n### Further reading\n- Rice, *Pottery Analysis*\n- Orton & Hughes, *Pottery in Archaeology*\n`,
  },
  {
    slug: "archaeology-101-field-kit",
    title: "Archaeology 101: Building a Field Kit",
    author: "Pryank Wadhera",
    date: "2025-07-10",
    hero: "https://images.unsplash.com/photo-1519120944692-1f7e6e7fbd3d?q=80&w=1400&auto=format&fit=crop",
    tags: ["field methods", "how-to", "gear"],
    minutes: 6,
    body: `# Archaeology 101: Building a Field Kit\n\nA dependable kit keeps digs safe and efficient.\n\n## Essentials\n- Trowel (pointed and margin)\n- Brushes (soft + stiff)\n- Scale bars & photo board\n- Hand lens (10x)\n\n## Recording\n- Waterproof notebook\n- Context sheets\n- GPS/total station access\n\n### Safety\nSun protection, hydration plan, first aid.\n`,
  },
  {
    slug: "digital-archaeology",
    title: "Digital Archaeology: Drones, Photogrammetry, and 3D",
    author: "Pryank Wadhera",
    date: "2025-06-14",
    hero: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
    tags: ["technology", "survey", "3D"],
    minutes: 8,
    body: `# Digital Archaeology: Drones, Photogrammetry, and 3D\n\nCheap sensors + fast compute have transformed documentation.\n\n## Flight planning\nOverlap, GSD, and ground control points matter.\n\n## From pixels to points\nStructure-from-Motion generates dense point clouds and textured meshes.\n\n## Ethics\nMind permissions, privacy, and site protection.\n`,
  },
];

// Glossary terms (hover for definition — inspired by Wikipedia hover cards)
const glossary: Record<string, string> = {
  typological: "Classification of artifacts based on shared attributes.",
  sherds: "Broken pieces of ceramic material found at sites.",
  chronology: "The dating and sequencing of past events and materials.",
};

// Learning paths (Khan Academy-style simple milestone tracker)
const learningTracks = [
  {
    id: "foundations",
    title: "Foundations of Archaeology",
    milestones: [
      { id: "what-is-arch", label: "What is Archaeology?" },
      { id: "methods", label: "Survey & Excavation Methods" },
      { id: "dating", label: "Dating Techniques" },
      { id: "ethics", label: "Ethics & Heritage" },
    ],
  },
  {
    id: "materials",
    title: "Materials & Analysis",
    milestones: [
      { id: "ceramics", label: "Ceramics" },
      { id: "lithics", label: "Lithics" },
      { id: "organics", label: "Organics" },
    ],
  },
];

// Utility: slugify a heading for anchors
const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Estimate reading time (like Medium)
const estimateMinutes = (md: string) => Math.max(3, Math.round(md.split(/\s+/).length / 220));

// Local storage helpers
const loadLS = (key: string, fallback: any) => {
  try { const val = localStorage.getItem(key); return val ? JSON.parse(val) : fallback; } catch { return fallback; }
};
const saveLS = (key: string, val: any) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ---------- Base UI elements ----------
const Chip: React.FC<{children: React.ReactNode, active?: boolean, onClick?: () => void}> = ({ children, active, onClick }) => (
  <button onClick={onClick} className={`px-3 py-1 rounded-full border text-sm transition shadow-sm hover:shadow ${active ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white/70 dark:bg-zinc-800/70 backdrop-blur border-zinc-200 dark:border-zinc-700'}`}>{children}</button>
);

const Card: React.FC<{children: React.ReactNode, onClick?: () => void, className?: string}> = ({ children, onClick, className }) => (
  <div onClick={onClick} className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur shadow-sm hover:shadow-md transition ${className || ''}`}>{children}</div>
);

const Button: React.FC<{children: React.ReactNode, onClick?: () => void, variant?: 'solid'|'ghost', className?: string, title?: string}> = ({ children, onClick, variant='solid', className, title }) => (
  <button title={title} onClick={onClick} className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition ${variant==='solid' ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90' : 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'} ${className||''}`}>{children}</button>
);

// ---------- Main App ----------
export default function ArchaeologyWalaApp() {
  const [dark, setDark] = useState<boolean>(() => loadLS('aw:dark', true));
  const [page, setPage] = useState<'home'|'blog'|'article'|'learn'|'library'|'contribute'|'about'>("home");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState(()=>loadLS('aw:posts', samplePosts));
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadLS('aw:bookmarks', []));
  const [fontScale, setFontScale] = useState<number>(() => loadLS('aw:fontScale', 100));
  const [activePost, setActivePost] = useState<typeof samplePosts[number] | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>(() => loadLS('aw:likes', {}));
  const [newsletterOK, setNewsletterOK] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>(()=> loadLS('aw:submissions', []));

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); saveLS('aw:dark', dark); }, [dark]);
  useEffect(() => { saveLS('aw:bookmarks', bookmarks); }, [bookmarks]);
  useEffect(() => { saveLS('aw:fontScale', fontScale); }, [fontScale]);
  useEffect(() => { saveLS('aw:likes', likes); }, [likes]);
  useEffect(() => { saveLS('aw:posts', posts); }, [posts]);
  useEffect(() => { saveLS('aw:submissions', submissions); }, [submissions]);

  const fuse = useMemo(() => new Fuse(posts, { keys: ['title', 'tags', 'body'], threshold: 0.33 }), [posts]);
  const filtered = useMemo(() => {
    if (!query) return posts;
    return fuse.search(query).map(r => r.item);
  }, [query, fuse, posts]);

  const openPost = (p: typeof samplePosts[number]) => { setActivePost(p); setPage('article'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggleBookmark = (slug: string) => setBookmarks(bm => bm.includes(slug) ? bm.filter(s => s!==slug) : [...bm, slug]);
  const clap = (slug: string) => setLikes(prev => ({ ...prev, [slug]: (prev[slug]||0) + 1 }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100" style={{ fontSize: `${fontScale}%` }}>
      <Header dark={dark} setDark={setDark} setPage={setPage} query={query} setQuery={setQuery} />
      <main id="content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.section key="home" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-12}} className="py-10 sm:py-16">
              <Hero setPage={setPage} />
              <Features />
              <PhotoStory />
              <LearningTracks tracks={learningTracks} />
              <LatestPosts posts={posts} openPost={openPost} bookmarks={bookmarks} toggleBookmark={toggleBookmark} />
            </motion.section>
          )}

          {page === 'blog' && (
            <motion.section key="blog" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-12}} className="py-10 sm:py-16">
              <BlogIndex posts={filtered} openPost={openPost} bookmarks={bookmarks} toggleBookmark={toggleBookmark} query={query} setQuery={setQuery} />
            </motion.section>
          )}

          {page === 'article' && activePost && (
            <motion.section key="article" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="py-6">
              <ArticleView post={activePost} onBack={() => setPage('blog')} glossary={glossary} bookmarked={bookmarks.includes(activePost.slug)} toggleBookmark={() => toggleBookmark(activePost.slug)} clap={() => clap(activePost.slug)} likes={likes[activePost.slug]||0} />
            </motion.section>
          )}

          {page === 'learn' && (
            <motion.section key="learn" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-12}} className="py-10 sm:py-16">
              <LearningTracks tracks={learningTracks} full />
            </motion.section>
          )}

          {page === 'library' && (
            <motion.section key="library" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-12}} className="py-10 sm:py-16">
              <ResourceLibrary />
            </motion.section>
          )}

          {page === 'contribute' && (
            <motion.section key="contribute" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-12}} className="py-10 sm:py-16">
              <Contribute submissions={submissions} setSubmissions={setSubmissions} setPage={setPage} addPost={(p:any)=>setPosts((prev:any)=>[p,...prev])} />
            </motion.section>
          )}

          {page === 'about' && (
            <motion.section key="about" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-12}} className="py-10 sm:py-16">
              <About newsletterOK={newsletterOK} setNewsletterOK={setNewsletterOK} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
      <Footer setPage={setPage} fontScale={fontScale} setFontScale={setFontScale} />
      <SEO />
    </div>
  );
}

// ---------- Sections ----------
const Header: React.FC<{dark: boolean; setDark: (b:boolean)=>void; setPage: (p:any)=>void; query:string; setQuery:(s:string)=>void}> = ({ dark, setDark, setPage, query, setQuery }) => (
  <header className="sticky top-0 z-50 border-b border-zinc-200/70 dark:border-zinc-800/70 backdrop-blur bg-white/70 dark:bg-zinc-900/60">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
      <button onClick={()=>setPage('home')} className="flex items-center gap-3 font-semibold text-lg">
        <Landmark className="w-6 h-6" /> ArchaeologyWala <span className="hidden sm:inline text-zinc-500">— a world by Pryank Wadhera</span>
      </button>
      <nav className="hidden md:flex items-center gap-2 ml-4">
        {[
          {k:'home', label:'Explore', icon: <Globe2 className="w-4 h-4"/>},
          {k:'blog', label:'Blog', icon: <BookOpen className="w-4 h-4"/>},
          {k:'learn', label:'Learn', icon: <Layers className="w-4 h-4"/>},
          {k:'contribute', label:'Contribute', icon: <Mail className="w-4 h-4"/>},
          {k:'about', label:'About', icon: <Info className="w-4 h-4"/>},
        ].map(item => (
          <Button key={item.k} variant="ghost" onClick={()=>setPage(item.k as any)}><span className="opacity-70">{item.icon}</span>{item.label}</Button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2 w-full md:w-auto">
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 w-full md:w-80">
          <Search className="w-4 h-4 opacity-60"/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search archaeology, tags, posts…" className="bg-transparent outline-none w-full"/>
        </div>
        <Button variant="ghost" onClick={()=>setDark(!dark)} title="Toggle dark mode">{dark? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</Button>
      </div>
    </div>
    <a href="#content" className="sr-only focus:not-sr-only">Skip to content</a>
  </header>
);

const Hero: React.FC<{setPage:(p:any)=>void}> = ({ setPage }) => (
  <section className="grid lg:grid-cols-2 gap-8 items-center">
    <div className="space-y-6">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">ArchaeologyWala <span className="opacity-60">— a world by</span> <span className="underline decoration-amber-400">Pryank Wadhera</span></h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-prose">Everything about archaeology: field methods, materials, digital tools, timelines, and stories from the past. Dive into curated learning paths and a clean, fast blog with modern comforts.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={()=>setPage('blog')}><BookOpen className="w-4 h-4"/> Read the Blog</Button>
        <Button variant="ghost" onClick={()=>setPage('learn')}><Layers className="w-4 h-4"/> Start Learning</Button>
        <Button variant="ghost" onClick={()=>setPage('library')}><Compass className="w-4 h-4"/> Explore Library</Button>
      </div>
      <div className="flex gap-2">
        {["material culture","field methods","3D","ceramics","ethics"].map(t => <Chip key={t}>{t}</Chip>)}
      </div>
    </div>
    <div className="relative">
      <img src="https://images.unsplash.com/photo-1541417904950-b855846fe074?q=80&w=1600&auto=format&fit=crop" alt="Archaeological site" className="rounded-3xl shadow-md w-full h-[360px] object-cover" loading="lazy"/>
      <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-2 rounded-2xl text-sm backdrop-blur">Photo story • Sahara rock art</div>
    </div>
  </section>
);

const Features: React.FC = () => (
  <section className="mt-12">
    <h2 className="text-2xl font-semibold mb-4">Best-in-class features</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        {icon: <Search className="w-5 h-5"/>, title:"Instant search", desc:"Fuzzy search across posts, tags, and notes."},
        {icon: <Clock className="w-5 h-5"/>, title:"Reading progress", desc:"Sticky progress bar and time estimates."},
        {icon: <Bookmark className="w-5 h-5"/>, title:"Bookmarks", desc:"Save articles to read later (offline-ready)."},
        {icon: <Share2 className="w-5 h-5"/>, title:"Share & cite", desc:"Copy link, quick BibTeX and JSON‑LD metadata."},
        {icon: <Grip className="w-5 h-5"/>, title:"TOC & anchors", desc:"Wikipedia-style deep linking to sections."},
        {icon: <Flame className="w-5 h-5"/>, title:"Photo stories", desc:"Immersive image galleries and captions."},
      ].map((f,i)=> (
        <Card key={i} className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300">{f.icon}</div>
            <div>
              <div className="font-medium">{f.title}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </section>
);

const PhotoStory: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const items = [
    {src:"https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7?q=80&w=1400&auto=format&fit=crop", caption:"Desert caravan route — tracing trade networks."},
    {src:"https://images.unsplash.com/photo-1523419409543-8c1ae1c1f729?q=80&w=1400&auto=format&fit=crop", caption:"Temple capitals — classical orders and symbolism."},
    {src:"https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=1400&auto=format&fit=crop", caption:"Field documentation — context is everything."},
  ];
  return (
    <section className="mt-12">
      <h3 className="text-xl font-semibold mb-3">Photo story</h3>
      <Card className="overflow-hidden">
        <div className="relative">
          <img src={items[idx].src} alt="story" className="w-full h-[360px] object-cover" loading="lazy"/>
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">{items[idx].caption}</div>
          <div className="absolute inset-0 flex items-center justify-between p-3">
            <Button variant="ghost" onClick={()=>setIdx((idx-1+items.length)%items.length)}><ChevronLeft/></Button>
            <Button variant="ghost" onClick={()=>setIdx((idx+1)%items.length)}><ChevronRight/></Button>
          </div>
        </div>
      </Card>
    </section>
  );
};

const LatestPosts: React.FC<{posts:any[]; openPost:(p:any)=>void; bookmarks:string[]; toggleBookmark:(s:string)=>void}> = ({ posts, openPost, bookmarks, toggleBookmark }) => (
  <section className="mt-12">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xl font-semibold">Latest posts</h3>
      <div className="text-sm text-zinc-500">{posts.length} articles</div>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map(p => (
        <motion.div key={p.slug} initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{delay:0.03}}>
          <Card className="overflow-hidden group">
            <div className="relative">
              <img src={p.hero} alt="cover" className="w-full h-40 object-cover group-hover:scale-[1.02] transition" loading="lazy"/>
              <button onClick={()=>toggleBookmark(p.slug)} className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700">
                {bookmarks.includes(p.slug) ? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
              </button>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-xs text-zinc-500">{formatDate(p.date)} • {p.minutes || estimateMinutes(p.body)} min read</div>
              <button onClick={()=>openPost(p)} className="text-lg font-semibold text-left hover:underline decoration-amber-400 underline-offset-2">{p.title}</button>
              <div className="flex flex-wrap gap-2 pt-1">
                {p.tags.map((t:string) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">{t}</span>)}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  </section>
);

const BlogIndex: React.FC<{posts:any[]; openPost:(p:any)=>void; bookmarks:string[]; toggleBookmark:(s:string)=>void; query:string; setQuery:(s:string)=>void}> = ({ posts, openPost, bookmarks, toggleBookmark, query, setQuery }) => {
  const allTags = Array.from(new Set(posts.flatMap((p:any)=>p.tags))).sort();
  const [tag, setTag] = useState<string|undefined>();
  const shown = tag ? posts.filter(p=>p.tags.includes(tag)) : posts;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Blog</h2>
        <div className="text-sm text-zinc-500">{shown.length} results</div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip active={!tag} onClick={()=>setTag(undefined)}>All</Chip>
        {allTags.map(t => <Chip key={t} active={t===tag} onClick={()=>setTag(t)}>{t}</Chip>)}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shown.map(p => (
          <Card key={p.slug} className="overflow-hidden">
            <img src={p.hero} alt="cover" className="w-full h-40 object-cover" loading="lazy"/>
            <div className="p-4 space-y-2">
              <div className="text-xs text-zinc-500">{formatDate(p.date)} • {p.minutes || estimateMinutes(p.body)} min read</div>
              <button onClick={()=>openPost(p)} className="text-lg font-semibold text-left hover:underline decoration-amber-400 underline-offset-2">{p.title}</button>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">{p.body.replace(/[#>*`]/g, '').slice(0, 120)}…</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2 flex-wrap">
                  {p.tags.map((t:string) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">{t}</span>)}
                </div>
                <button onClick={()=>toggleBookmark(p.slug)} title="Bookmark" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  {bookmarks.includes(p.slug) ? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ---- Comments (local, simple) ----
const Comments: React.FC<{slug:string}> = ({ slug }) => {
  const key = `aw:comments:${slug}`;
  const [items, setItems] = useState<any[]>(()=> loadLS(key, []));
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  useEffect(()=> saveLS(key, items), [items]);
  const add = ()=> {
    if (!name.trim() || !text.trim()) { alert('Please add your name and comment.'); return; }
    const item = { id: Date.now(), name: name.trim(), text: text.trim(), date: new Date().toISOString() };
    setItems([item, ...items]);
    setText("");
  };
  return (
    <Card className="p-5 mt-4">
      <div className="font-medium mb-2">Comments ({items.length})</div>
      <div className="space-y-3 mb-4">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"/>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write a thoughtful comment…" className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent min-h-[90px]"/>
        <Button onClick={add}>Post Comment</Button>
      </div>
      <ul className="space-y-4">
        {items.map(it=> (
          <li key={it.id} className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="text-sm font-medium">{it.name} <span className="text-xs text-zinc-500">• {new Date(it.date).toLocaleString()}</span></div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{it.text}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const ArticleView: React.FC<{post:any; onBack:()=>void; glossary:Record<string,string>; bookmarked:boolean; toggleBookmark:()=>void; clap:()=>void; likes:number}> = ({ post, onBack, glossary, bookmarked, toggleBookmark, clap, likes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [toc, setToc] = useState<{level:number; text:string; id:string}[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const scrolled = Math.min(1, Math.max(0, el.scrollTop / max));
      setProgress(scrolled);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Build TOC by scanning headings in markdown
    const lines = post.body.split(/\n/);
    const items: {level:number; text:string; id:string}[] = [];
    for (const line of lines) {
      const m = /^(#{1,6})\s+(.+)$/.exec(line);
      if (m) {
        const level = m[1].length;
        const text = m[2].replace(/`/g, '');
        const id = slugify(text);
        items.push({ level, text, id });
      }
    }
    setToc(items);
  }, [post]);

  const components = {
    h1: (props:any) => <h1 id={slugify(String(props.children))} className="text-3xl font-bold mt-6 mb-3" {...props} />,
    h2: (props:any) => <h2 id={slugify(String(props.children))} className="text-2xl font-semibold mt-6 mb-2" {...props} />,
    h3: (props:any) => <h3 id={slugify(String(props.children))} className="text-xl font-semibold mt-4 mb-2" {...props} />,
    p: (props:any) => <p className="leading-7 my-3" {...props} />,
    a: (props:any) => <a className="underline decoration-amber-400 underline-offset-2" {...props} />,
    strong: (props:any) => <strong className="font-semibold" {...props} />,
    em: (props:any) => <em className="italic" {...props} />,
    // Glossary hover: wrap certain words with title tooltip
    text: ({ node, children }: any) => {
      const text = String(children);
      const parts = text.split(/(typological|sherds|chronologies?)/gi);
      return <>{parts.map((part, i) => {
        const key = part.toLowerCase().replace(/s$/, '');
        if (glossary[key]) {
          return <span key={i} title={glossary[key]} className="underline decoration-dotted decoration-amber-400 cursor-help">{part}</span>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}</>;
    },
  } as any;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href + '#' + post.slug); alert('Link copied!'); } catch {}
  };
  const copyBibTex = async () => {
    const y = new Date(post.date).getFullYear();
    const key = (post.author.split(' ')[0] || 'author') + y + '-' + post.slug.split('-')[0];
    const bib = `@article{${key},\n  title={${post.title}},\n  author={${post.author}},\n  journal={ArchaeologyWala},\n  year={${y}},\n  url={${typeof window !== 'undefined' ? window.location.href : 'https://archaeologywala.example'}},\n}`;
    try { await navigator.clipboard.writeText(bib); alert('BibTeX copied!'); } catch {}
  };

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      {/* TOC */}
      <aside className="hidden lg:block sticky top-20 self-start">
        <Card className="p-4">
          <div className="font-medium mb-2">On this page</div>
          <nav className="text-sm space-y-1">
            {toc.map(item => (
              <a key={item.id} href={`#${item.id}`} className={`block pl-${(item.level-1)*2} hover:underline underline-offset-2`}>{item.text}</a>
            ))}
          </nav>
        </Card>
      </aside>

      {/* Article */}
      <div className="space-y-4">
        <div className="h-1 sticky top-16 z-40 bg-amber-200/40 dark:bg-amber-500/20">
          <div className="h-1 bg-amber-500" style={{ width: `${progress*100}%` }} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onBack}><ChevronLeft className="w-4 h-4"/> Back</Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={copyLink} title="Copy link"><Share2 className="w-4 h-4"/></Button>
            <Button variant="ghost" onClick={copyBibTex} title="Copy BibTeX"><BookOpen className="w-4 h-4"/></Button>
            <Button variant="ghost" onClick={toggleBookmark} title="Bookmark">{bookmarked? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}</Button>
            <Button onClick={clap} title="Applaud (local)">👏 <span className="text-xs opacity-70">{likes}</span></Button>
          </div>
        </div>
        <Card className="overflow-hidden">
          <img src={post.hero} alt="cover" className="w-full h-64 object-cover"/>
          <div className="p-6">
            <div className="text-sm text-zinc-500">{formatDate(post.date)} • {post.minutes || estimateMinutes(post.body)} min read • <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5"/>{post.author}</span></div>
            <h1 className="text-3xl font-bold mt-1">{post.title}</h1>
          </div>
          <div ref={containerRef} className="max-h-[60vh] overflow-y-auto border-t border-zinc-200 dark:border-zinc-800 p-6 prose prose-zinc dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as any}>
              {post.body}
            </ReactMarkdown>
          </div>
        </Card>
        <Comments slug={post.slug} />
      </div>
    </div>
  );
};

const LearningTracks: React.FC<{tracks:any[]; full?:boolean}> = ({ tracks, full }) => {
  const [progress, setProgress] = useState<Record<string, string[]>>(()=> loadLS('aw:track', {}));
  useEffect(()=> saveLS('aw:track', progress), [progress]);

  const toggle = (trackId:string, msId:string) => setProgress(p => {
    const cur = new Set(p[trackId] || []);
    cur.has(msId) ? cur.delete(msId) : cur.add(msId);
    return { ...p, [trackId]: Array.from(cur) };
  });

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">Learning paths</h3>
        <div className="text-sm text-zinc-500">Track your progress</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {tracks.map(t => (
          <Card key={t.id} className="p-5">
            <div className="font-medium text-lg mb-3">{t.title}</div>
            <div className="space-y-2">
              {t.milestones.map((m:any) => {
                const done = progress[t.id]?.includes(m.id);
                return (
                  <label key={m.id} className="flex items-center gap-3">
                    <input type="checkbox" checked={!!done} onChange={()=>toggle(t.id, m.id)} className="w-4 h-4"/>
                    <span className={done? 'line-through opacity-70' : ''}>{m.label}</span>
                  </label>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      {!full && <div className="mt-3"><span className="text-sm text-zinc-600 dark:text-zinc-400">Tip: open the Learn tab for full view.</span></div>}
    </section>
  );
};

const ResourceLibrary: React.FC = () => (
  <div>
    <h2 className="text-3xl font-bold mb-4">Resource Library</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[{
        title:"Open Datasets",
        items:["Portable Antiquities Scheme (UK)", "Open Context", "tDAR", "Digital Archaeological Archive of Comparative Slavery"],
      },{
        title:"Software & Tools",
        items:["QGIS", "Meshroom (SfM)", "CloudCompare", "OpenRefine"],
      },{
        title:"Guides & Methodologies",
        items:["FAIMS mobile recording", "CIDOC-CRM overview", "Dublin Core for artifacts"],
      }].map((g,i) => (
        <Card key={i} className="p-5">
          <div className="font-medium mb-2">{g.title}</div>
          <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
            {g.items.map((it:string) => <li key={it}>{it}</li>)}
          </ul>
        </Card>
      ))}
    </div>

    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-3">Learning Videos</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[{title:"British Museum — Curator's Corner (Archaeology)", href:"https://www.youtube.com/playlist?list=PLS3XGZxi7cBXyq-FkRbM5iA6aV0NwGZ9A"}, {title:"National Geographic — Archaeology", href:"https://www.youtube.com/results?search_query=national+geographic+archaeology"}, {title:"Smithsonian Channel — Archaeology & Ancient Mysteries", href:"https://www.youtube.com/results?search_query=smithsonian+archaeology"}, {title:"Khan Academy — Art History (Ancient)", href:"https://www.khanacademy.org/humanities/art-history/ancient-art-civilizations"}, {title:"Oxford Archaeology talks", href:"https://www.youtube.com/results?search_query=oxford+archaeology+talk"}, {title:"Archaeology tutorials: QGIS basics", href:"https://www.youtube.com/results?search_query=QGIS+for+archaeology"}].map(v => (
          <Card key={v.title} className="p-5">
            <a href={v.href} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-amber-400 underline-offset-2">{v.title}</a>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">External video resource</div>
          </Card>
        ))}
      </div>
    </div>

    <p className="text-xs text-zinc-500 mt-2">Names are for illustration; link them to official sources when you go live.</p>
  </div>
);


const Contribute: React.FC<{submissions:any[]; setSubmissions:(fn:any)=>void; setPage:(p:any)=>void; addPost:(p:any)=>void}> = ({ submissions, setSubmissions, setPage, addPost }) => {
  const [form, setForm] = useState({ name:"", email:"", affiliation:"", title:"", tags:"", cover:"", summary:"", body:"", agree:false });
  const [preview, setPreview] = useState(false);
  const [token, setToken] = useState(loadLS('aw:reviewToken', ''));
  const reviewMode = token === 'archadmin'; // demo token; replace in production

  useEffect(()=> saveLS('aw:reviewToken', token), [token]);

  const submit = () => {
    if (!form.name || !form.email || !form.title || !form.body || !form.agree) { alert('Please fill required fields and agree to the terms.'); return; }
    const id = Date.now();
    const sub = { id, ...form, status:'pending', date: new Date().toISOString() };
    setSubmissions((prev:any)=> [sub, ...prev]);
    setForm({ name:'', email:'', affiliation:'', title:'', tags:'', cover:'', summary:'', body:'', agree:false });
    alert('Thanks! Your article was submitted for review.');
  };

  const approve = (s:any) => {
    const slug = slugify(s.title) || ('submission-' + s.id);
    const post = { slug, title:s.title, author: s.name, date: new Date().toISOString().slice(0,10), hero: s.cover || 'https://images.unsplash.com/photo-1541417904950-b855846fe074?q=80&w=1600&auto=format&fit=crop', tags: s.tags? s.tags.split(',').map((t:string)=>t.trim()).filter(Boolean):[], minutes: estimateMinutes(s.body), body: `# ${s.title}\n\n${s.body}` };
    addPost(post);
    setSubmissions((prev:any)=> prev.filter((x:any)=> x.id !== s.id));
    setPage('blog');
  };

  const reject = (s:any) => {
    if (!confirm('Reject and remove this submission?')) return;
    setSubmissions((prev:any)=> prev.filter((x:any)=> x.id !== s.id));
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">Contribute an Article</h2>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent" placeholder="Your full name *" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent" placeholder="Email *" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
            <input className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent" placeholder="Affiliation / Bio" value={form.affiliation} onChange={e=>setForm({...form, affiliation:e.target.value})}/>
            <input className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent" placeholder="Cover image URL (optional)" value={form.cover} onChange={e=>setForm({...form, cover:e.target.value})}/>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent" placeholder="Article title *" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
            <input className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent" placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})}/>
          </div>
          <textarea className="mt-3 w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent" placeholder="Short summary (optional)" value={form.summary} onChange={e=>setForm({...form, summary:e.target.value})} />
          <textarea className="mt-3 w-full min-h-[220px] px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent font-mono" placeholder="Write your article in Markdown here *" value={form.body} onChange={e=>setForm({...form, body:e.target.value})} />
          <div className="mt-3 flex items-center justify-between">
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.agree} onChange={e=>setForm({...form, agree:e.target.checked})}/> I confirm this is original work and I have rights to publish any images.</label>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={()=>setPreview(!preview)}>{preview? 'Hide' : 'Preview'}</Button>
              <Button onClick={submit}><Mail className="w-4 h-4"/> Submit for review</Button>
            </div>
          </div>
          {preview && (
            <Card className="p-4 mt-4">
              <div className="text-sm text-zinc-500 mb-2">Preview</div>
              <div className="prose prose-zinc dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {`# ${form.title || '(untitled)'}\n\n${form.body || '*Start writing to see the preview…*'}`}
                </ReactMarkdown>
              </div>
            </Card>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-medium mb-2">Submission Guidelines</div>
            <ul className="list-disc list-inside text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
              <li>Original, unpublished work; 800–2,500 words recommended.</li>
              <li>Use simple Markdown; include references at the end.</li>
              <li>Add image credits and ensure you have usage rights.</li>
              <li>Stick to respectful, evidence‑based writing.</li>
              <li>Light copy‑editing for clarity and style may be performed.</li>
            </ul>
          </Card>          <Card className=\"p-5\">
            <div className=\"font-medium mb-2\">Editorial Review (demo)</div>
            <div className=\"text-sm text-zinc-600 dark:text-zinc-40