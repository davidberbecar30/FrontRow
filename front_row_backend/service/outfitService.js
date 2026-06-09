/**
 * outfitService.js
 *
 * Template-based outfit suggestions per event category + gender.
 * Images use permanent Unsplash CDN photo URLs (no API key, no redirects).
 */

// ── Store URL builders ───────────────────────────────────────────────────────
const stores = (term) => [
    { name: 'H&M',  url: `https://www2.hm.com/en_us/search-results.html?q=${encodeURIComponent(term)}` },
    { name: 'Zara', url: `https://www.zara.com/us/en/search?searchTerm=${encodeURIComponent(term)}` },
    { name: 'ASOS', url: `https://www.asos.com/us/search/?q=${encodeURIComponent(term)}` }
]

// ── Permanent Unsplash CDN URLs ──────────────────────────────────────────────
// Direct photo links — no API key needed, load instantly, never expire.
const U = (id) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&auto=format&q=80`

const PHOTOS = {
    // Men
    mGraphicTee:     U('1576566588028-4147f3842f27'),
    mDarkJeans:      U('1542272604-787c3835535d'),
    mButtonDown:     U('1602810318383-e386cc2a3ccf'),
    mTrousers:       U('1473966968600-fa801b869a1a'),
    mLinenShirt:     U('1507679799987-c73779587ccf'),
    mChinos:         U('1624378439575-d8705ad7ae80'),
    mCargoShorts:    U('1562183241-840b8af0721e'),
    mSweater:        U('1521572163474-6864f9cf17ab'),
    // Women
    wCropTop:        U('1515372039744-b8f02a3ae446'),
    wBlouse:         U('1525507119028-ed4c629a60a3'),
    wHighWaistJeans: U('1541099649105-f69ad21f3246'),
    wMidiSkirt:      U('1583496661160-fb5974ca0fba'),
    wWideLegs:       U('1594938298603-c8148c4dae35'),
    wBohoTop:        U('1483985988355-763728e1935b'),
    wFlowingSkirt:   U('1490481651871-ab68de25d43d'),
    wVelvetBlouse:   U('1508214751196-bcfd4ca60f91'),
    wLeatherShorts:  U('1584370848010-d7fe6bc767ec'),
}

// ── Outfit templates ─────────────────────────────────────────────────────────
const TEMPLATES = {
    Concert: {
        male: {
            top: {
                name: 'Graphic Band Tee',
                description: 'A bold graphic tee is the ultimate concert statement — show your music taste loud and proud.',
                image: PHOTOS.mGraphicTee,
                stores: stores('men graphic band tee')
            },
            bottom: {
                name: 'Slim Dark Jeans',
                description: 'Slim-fit dark jeans keep things sharp while staying comfortable through the whole set.',
                image: PHOTOS.mDarkJeans,
                stores: stores('men slim fit dark jeans')
            }
        },
        female: {
            top: {
                name: 'Sequin Crop Top',
                description: 'A sequin or metallic crop top catches the stage lights and keeps energy high all night.',
                image: PHOTOS.wCropTop,
                stores: stores('women sequin crop top')
            },
            bottom: {
                name: 'High-Waist Leather Shorts',
                description: 'High-waisted faux leather shorts with tights — edgy, comfy, and crowd-ready.',
                image: PHOTOS.wLeatherShorts,
                stores: stores('women high waist leather shorts')
            }
        }
    },
    Sports: {
        male: {
            top: {
                name: 'Team Jersey or Polo',
                description: 'Rep the home team with a jersey or go smart-casual with a polo — either works perfectly.',
                image: PHOTOS.mSweater,
                stores: stores('men sports jersey polo shirt')
            },
            bottom: {
                name: 'Jogger Chinos',
                description: 'Slim jogger-style chinos give you comfort for the stands without sacrificing style.',
                image: PHOTOS.mChinos,
                stores: stores('men jogger chinos')
            }
        },
        female: {
            top: {
                name: 'Oversized Team Tee',
                description: 'An oversized team tee knotted at the front is effortlessly sporty-chic.',
                image: PHOTOS.wCropTop,
                stores: stores('women oversized casual tee')
            },
            bottom: {
                name: 'Biker Shorts',
                description: 'Sleek biker shorts with chunky sneakers — the winning game-day combo.',
                image: PHOTOS.wHighWaistJeans,
                stores: stores('women biker shorts')
            }
        }
    },
    Theater: {
        male: {
            top: {
                name: 'Oxford Button-Down Shirt',
                description: 'A crisp Oxford button-down — timeless, polished, and always appropriate for the theater.',
                image: PHOTOS.mButtonDown,
                stores: stores('men oxford button down shirt')
            },
            bottom: {
                name: 'Tailored Dress Trousers',
                description: 'Well-fitted tailored trousers complete a smart-casual theater look effortlessly.',
                image: PHOTOS.mTrousers,
                stores: stores('men tailored dress trousers')
            }
        },
        female: {
            top: {
                name: 'Elegant Silk Blouse',
                description: 'A flowing silk blouse strikes the perfect balance between refined and relaxed.',
                image: PHOTOS.wBlouse,
                stores: stores('women silk blouse elegant')
            },
            bottom: {
                name: 'Wide-Leg Tailored Trousers',
                description: 'Wide-leg trousers in a neutral tone bring modern elegance to any theater night.',
                image: PHOTOS.wWideLegs,
                stores: stores('women wide leg tailored trousers')
            }
        }
    },
    Festival: {
        male: {
            top: {
                name: 'Linen Button-Up Shirt',
                description: 'A relaxed linen shirt — breathable for all-day festival fun and easy to style open or closed.',
                image: PHOTOS.mLinenShirt,
                stores: stores('men linen button up shirt')
            },
            bottom: {
                name: 'Cargo Shorts',
                description: 'Cargo shorts with pockets for everything — practical and perfectly festival-ready.',
                image: PHOTOS.mCargoShorts,
                stores: stores('men cargo shorts')
            }
        },
        female: {
            top: {
                name: 'Boho Crochet Top',
                description: 'A crochet or boho-style top layered over a bandeau is the ultimate festival look.',
                image: PHOTOS.wBohoTop,
                stores: stores('women boho crochet top festival')
            },
            bottom: {
                name: 'Flowy Midi Skirt',
                description: 'A flowy printed midi skirt moves beautifully and keeps you cool all day.',
                image: PHOTOS.wFlowingSkirt,
                stores: stores('women flowy midi skirt')
            }
        }
    },
    Magic: {
        male: {
            top: {
                name: 'Smart Crew-Neck Sweater',
                description: 'A refined crew-neck or fine-knit sweater — perfect for a mysterious, put-together look.',
                image: PHOTOS.mSweater,
                stores: stores('men crew neck sweater smart')
            },
            bottom: {
                name: 'Slim Chinos',
                description: 'Clean slim chinos in charcoal or navy tie the look together neatly.',
                image: PHOTOS.mChinos,
                stores: stores('men slim fit chinos')
            }
        },
        female: {
            top: {
                name: 'Velvet Wrap Blouse',
                description: 'A rich velvet or deep jewel-toned wrap blouse adds drama and elegance to the evening.',
                image: PHOTOS.wVelvetBlouse,
                stores: stores('women velvet wrap blouse')
            },
            bottom: {
                name: 'Straight-Leg Satin Trousers',
                description: 'Straight-leg satin trousers catch the light and complete a sleek, sophisticated look.',
                image: PHOTOS.wMidiSkirt,
                stores: stores('women satin trousers evening')
            }
        }
    }
}

const FALLBACK = { male: TEMPLATES.Festival.male, female: TEMPLATES.Festival.female }

function suggestOutfit(category, gender) {
    const byCategory = TEMPLATES[category] || FALLBACK
    const byGender   = byCategory[gender]  || byCategory.male
    return { top: byGender.top, bottom: byGender.bottom }
}

module.exports = { suggestOutfit }
