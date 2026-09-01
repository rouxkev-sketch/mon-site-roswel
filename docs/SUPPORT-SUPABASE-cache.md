# Le message à envoyer au support Supabase

**Passe nº 781.** Tout est déjà écrit : il n'y a qu'à **remplacer les
quelques `⟨…⟩`** par les chiffres que produit
`sh outils/comparer-le-cache` (ils sont aussi dans
`comparer-le-cache.txt`), puis à envoyer.

---

## Avant d'envoyer — les trois choses à coller dedans

1. **La référence du projet** : `⟨identifiant du projet US⟩` — c'est ce
   qu'il y a entre `https://` et `.supabase.co` dans ton adresse.
2. **La version du service** relevée par l'outil, pour chaque projet.
3. **Les deux lignes de l'expérience** : ce que le service *range* et ce
   qu'il *sert*, des deux côtés.

> **Ne colle jamais ta clé secrète dans un message de support.** Aucun
> des chiffres demandés ci-dessus n'en contient, et l'outil n'en affiche
> aucune.

---

## Le message (en anglais — c'est la langue de leur support)

> **Subject:** Storage serves `cache-control: no-cache` even though the
> object metadata says `max-age=31536000`
>
> **Project ref:** `⟨identifiant du projet⟩` (region: East US)
> **Bucket:** `photos-tatoueurs` (public)
> **Storage version:** `⟨version relevée⟩`
>
> **What happens**
>
> Every object in this bucket is served with `cache-control: no-cache`,
> regardless of the `cacheControl` value used at upload time. The value
> *is* stored — the API reports it — but it is never served.
>
> For one object:
>
> ```
> # what the API reports (storage.objects metadata)
> GET /storage/v1/object/info/photos-tatoueurs/⟨chemin⟩
>   → cacheControl: "max-age=31536000"
>
> # what the service actually serves (authenticated origin read,
> # not the CDN — no cf-cache-status HIT involved)
> HEAD /storage/v1/object/photos-tatoueurs/⟨chemin⟩
>   → cache-control: no-cache
> ```
>
> **What we tried** (all confirmed "written without error", all read
> back from the origin, never from the CDN):
>
> | Method | Result |
> |---|---|
> | binary upload `POST` with `cache-control: max-age=31536000` | metadata updated, served `no-cache` |
> | binary upload `PUT` (update) with the same header | metadata updated, served `no-cache` |
> | multipart upload with the `cacheControl` form field (what supabase-js does) | metadata updated, served `no-cache` |
> | `POST /object/copy` with `copyMetadata: false` + `metadata.cacheControl` | metadata updated, served `no-cache` |
> | delete + fresh upload (brand-new object) | metadata updated, served `no-cache` |
>
> So this is not about a particular file, nor about how it is uploaded:
> a brand-new object exhibits it too.
>
> **Comparison with our previous project** — same bucket name, same
> upload code, same `cacheControl` value:
>
> ```
> ⟨ancien projet⟩ : serves cache-control: ⟨relevé⟩
> ⟨nouveau projet⟩: serves cache-control: ⟨relevé⟩
> ```
>
> **Why it matters:** the bucket holds ~1150 portfolio images. Served
> with `no-cache`, every image is revalidated against the origin on
> every page view, from Europe to East US.
>
> **Question:** is there a project- or bucket-level setting that
> overrides the per-object `cacheControl`, or is the stored value not
> being propagated to the storage layer on this project?

---

## Ce qu'on peut déjà dire, et qui tient sans eux

- **Le seau ne porte aucun réglage de cache.** Ce n'est pas une
  supposition : la réponse du service pour un seau ne contient que son
  identité, son caractère public, sa date, une taille limite et des
  types permis. Il n'y a rien à y régler.
- **Le service sert `no-cache` par défaut** quand l'objet de stockage
  n'a pas de consigne — c'est écrit dans son code. Nos dépôts
  renseignent bien la ligne en base ; ce qui n'arrive pas jusqu'au
  stockage, c'est la consigne elle-même.
- **Ce n'est pas le réseau de diffusion.** Toutes ces lectures passent
  par l'adresse authentifiée, que ce réseau ne met jamais en cache
  (leçon de la nº 780 : l'adresse publique, elle, peut répondre `HIT`
  et montrer une consigne périmée).

---

## En attendant leur réponse

Le site fonctionne : les photos s'affichent. Ce qui se paie, c'est un
aller-retour jusqu'aux États-Unis à chaque affichage — donc de la
lenteur, pas une panne. Il n'y a **rien à corriger dans le code du
site** : `lib/cache-photos` pose déjà la bonne consigne, et les outils
la posent aussi. Quand le service la servira, tout sera en place sans
qu'on y retouche.
