<p align="center">
  <a href="https://www.dougs.fr/" target="blank"><img src="https://chez.dougs.fr/hs-fs/hubfs/dougs-logo.png?width=606&height=156&name=dougs-logo.png" width="600" alt="Dougs Logo" /></a>
</p>

### approche :
l'une des <u>**Fondamentaux**</u> de NestJs est de traiter tout ce qui est `request validation` en utilisant la `ValidationPipe`
le problème semble nous diriger vers cette approche, on va alors :

- utiliser les `class-validator` et `class-transformer` sur notre modèle de request

- faire usage de la `ValidationPipe` , ses options de transformation automatique et son `exceptionFactory` afin de personnaliserle message d'erreur

- ++ pourquoi pas faire des custom validators ??
 
... et pooof 🧙🪄: voilà notre DTO avec des CustomValidators `@NoFailedBalance()` , `@NoDuplicateMovement()` et `@NoUncontrolledMovement()` :

```typescript
import {
  NoDuplicateMovement, 
  NoFailedBalance, 
  NoUncontrolledMovement }
  from '@banking/movements-validator';

export class ValidationRequestDto {
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  @NoFailedBalance() // valider si on a des 'failed balances'
  balances: BalanceDto[];

  @ValidateNested({ each: true })
  @Type(() => MovementDto)
  @NoDuplicateMovement() // valider si on a des 'duplicate movements'
  @NoUncontrolledMovement() // valider si on a des 'uncontrolled movements'
  movements: MovementDto[];
}
```

derrière chaque annotation réside un `Decorator`, que lui est lié à une `Constraint` qui implémente l'interface `ValidatorConstraintInterface` en forme de service `@Injectable()`.

la simple existence de l'annotation va déclencher la méthode  `validate(value,args):boolean` de la `Constraint` et là on va devoir retourner `true` si pas d'erreur et `false` s'il y'en a.

dans le cas ou on a capturé une erreur sur l'objet courant, la moulinette de validation déclenche la méthode `defaultMessage():string` pour prendre le message à présenter à l'usager; ce message va être un message custom construit avec les informations de l'erreur sous forme de string json.

de toute façon le rôle de la `Constraint` se limite à être invoqué par la moulinette de validation NestJs pour :

  1- extraire les informations nécessaire de l'objet courant de la validation (`Balance[]` et `Movement[]`)

  2- donner ces `Balance[]` et `Movement[]` à un service agissant comme 'error' `Finder`

  3- définir le message string custom via `defaultMessage():string` qui sera retourné en cas de `false` retounée par `validate()`

la question là : Comment cette `Constraint` retourne un `true` ou `false` ? S de SOLID oblige, on délègue cela au service mentionné au dessus le : ('error' `Finder`) qui  prend les `Balance[]` et `Movement[]` (ou juste les `Movement[]` dans le cas de recherche d'erreurs de duplication sur les `Movement[]`)

on a 3 annotation => 3 Service error `Finder` :

```typescript
export interface BalanceFailure {
  expectedBalance: number;
  movementsSum: number;
  initialBalance: Balance;
  failedBalance: Balance;
}

export interface FailedBalancesFinder {
  // return failed balance with the expected amount and the balance details
  findFailedBalances(
    balances: Balance[],
    movements: Movement[],
  ): BalanceFailure[];
}
```
```typescript
export interface UncontrolledMovementsFinder {
  // return movement that were not delimeted by balances
  findUncontrolledMovements(
    balances: Balance[],
    movements: Movement[],
  ): Movement[];
}
```
```typescript
export interface DuplicateMovementsFinder {
  // return duplicated movements with same id
  findDuplicateMovements(movements: Movement[]): Movement[];
}
```
---

# 💡l'idée d'implémentation :

et si on transforme ces `Balance[]` et `Movement[]` en `Chunk[]`

mais c'est quoi un `Chunk` ? voilà : tout simplement :

```typescript
export interface Chunk {
  startBalance?: Balance;
  endBalance?: Balance;
  movements?: Movement[];
}
```
il suffit alors de construire des `Chunk` (suivant notre liste de `Balance[]`) et puis, on place les `Movement[]` un par un dans le `Chunk` avec le `startBalance` et `endBalance` délimitant sa date d'effet.


bien sûr on gère les edge cases :
---
et si on n'a pas de `Balance` daté avant certains `Movement[]` de notre liste ??
> on met ces `Movement[]` dans un `Chunk` avec `startBalance` à null !

---
et si on n'a pas de `Balance` daté après certains `Movement[]` de notre liste ??
> on met ces `Movement[]` dans un `Chunk` avec `endBalance` à null !

---
et si on a que des `Movement[]` et pas de `Balance` ?
> ils seront placé dans un `Chunk` avec `startBalance` et `endBalance` à null !

---
et si on a que des `Balance[]` et pas de `Movement[]` ?
> on aurait alors que des `Chunk[]` ayant l'attribut `movements` un tableau vide `[]` !


---

et voilà l'interface de service du `ChunkGenerator` (vous pouvez prendre plaisir à lire l'implémentation : `ChunkGeneratorImpl`):

```typescript
export interface ChunkGenerator {
  transformToChunks(
    balances: Balance[],
    movements: Movement[],
  ): Chunk[];
}
```

dans ce stade, chaque error `Finder` a une liste de `Chunk[]` qu'il peux vérifier `Chunk` par `Chunk` pour le valider selon son besoin.

>à voir : `FailedBalancesFinderImpl` et `UncontrolledMovementsFinderImpl` qui utilise le `ChunkGenerator`


>⚠️ `DuplicateMovementsFinderImpl` n'a pas besoin de calculer les `Chunk` pour vérifier les doublons des `Movement[]`

avantages / inconvénients de cette approche :

✅ séparation de concerne, chaque error `Finder` peux se baser sur les `Chunk[]` pour faire son propre check (pas besoin d'avoir tout sous un seul et même 'loop' difficilement extensible)

⛔ on va être mené à recalculer les `Chunk[]` à chaque check séparé => cela pourrait être source de soucis de perf 

pour gérer cet inconvéniant je me permet d'ouvrir une petite parenthèse
💡=> on peux faire une version 'caché' de ce `ChunkGenerator` ou MeMoizé : 👉 `MemoizedChunkGenerator`

++ point de vigilance, ⚠️ pour que le cache réussisse on doit s'assurer qu'on a toujours la même 'instance' de `ChunkGenerator` pour s'assurer que tout les appels passent ce même service pour être memoizé (c'est une simple memoization pas un vrai cache avec du vrai cache management)

=> on peux faire usage de `DynamicModules` et provide `forRoot()` pour s'assurer de ça

trade-off : la Mémoization nous a fait gagné x3 sur le temps d'execution (constatés sur les payload minimaliste ... une étude plus sérieuse pourrait prendre place en cas cela s'avère trop impactant)

---
arrivant là il ne reste que scruter le code, alors, prenez plaisir 👇

# it's Diss* time 🎤🤬🎙️💢💥

>>> **(Wikipedia)* : Une diss song, ou diss track, ou tout simplement diss, est une chanson, presque exclusivement de rap, en argot, violente, ayant pour but une attaque à l'encontre d'un ou plusieurs autres rappeurs
## folder structure :

```bash
.
├── libs
│   ├── model # Movement & Balance interfaces - library
│   │   └── src
│   ├── movements-validation-services # error Finder services + chunk generator - library
│   │   └── src
│   │       ├── chunk-generator
│   │       ├── duplicate-movements-finder
│   │       ├── failed-balances-finder
│   │       └── uncontrolled-movements-finder
│   └── movements-validator # validation decorators (constraints) - library
│       └── src
│           ├── no-duplicate-movement
│           ├── no-failed-balance
│           └── no-uncontrolled-movement
└── src # app bootstrap
    ├── movements-validation # controller + dto
    └── validation-pipe-utils # utils for exceptionFactory and ValidationError flatening + error status management
```

et vers les questions qui fâche : coverage ?
---

# 👌90% ✅
>🤖 GPT en a pour quelque chose mais ... je suis déjà un parano ++ franchement ... le robot est encore loin d'être au top (ça aide bien mais ... plutôt compter sur sa propre intelligence)

```diff
-----------------------------------------------------------------------|---------|----------|---------|---------|-------------------
+File                                                                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------------------------------------------------------------|---------|----------|---------|---------|-------------------
+All files                                                             |   95.75 |    90.76 |   96.49 |   95.27 |                   
- libs/model/src                                                       |       0 |      100 |     100 |       0 |                   
-  index.ts                                                            |       0 |      100 |     100 |       0 | 1                 
+ libs/movements-validation-services/src                               |     100 |      100 |     100 |     100 |                   
+  index.ts                                                            |     100 |      100 |     100 |     100 |                   
+  movements-validation-services.module.ts                             |     100 |      100 |     100 |     100 |                   
+ libs/movements-validation-services/src/chunk-generator               |     100 |     92.5 |     100 |     100 |                   
+  chunk-generator.module.ts                                           |     100 |      100 |     100 |     100 |                   
+  chunk-generator.service.impl.ts                                     |     100 |     92.5 |     100 |     100 | 88,128,143        
+  chunk-generator.service.ts                                          |     100 |      100 |     100 |     100 |                   
+  memoized-chunk-generator.service.impl.ts                            |     100 |      100 |     100 |     100 |                   
+ libs/movements-validation-services/src/duplicate-movements-finder    |     100 |      100 |     100 |     100 |                   
+  duplicate-movements-finder.service.impl.ts                          |     100 |      100 |     100 |     100 |                   
+  duplicate-movements-finder.service.ts                               |     100 |      100 |     100 |     100 |                   
+ libs/movements-validation-services/src/failed-balances-finder        |     100 |      100 |     100 |     100 |                   
+  failed-balances-finder.service.impl.ts                              |     100 |      100 |     100 |     100 |                   
+  failed-balances-finder.service.ts                                   |     100 |      100 |     100 |     100 |                   
+ libs/movements-validation-services/src/uncontrolled-movements-finder |     100 |      100 |     100 |     100 |                   
+  uncontrolled-movements-finder.service.impl.ts                       |     100 |      100 |     100 |     100 |                   
+  uncontrolled-movements-finder.service.ts                            |     100 |      100 |     100 |     100 |                   
+ libs/movements-validator/src                                         |     100 |      100 |     100 |     100 |                   
+  index.ts                                                            |     100 |      100 |     100 |     100 |                   
+  movements-validator.module.ts                                       |     100 |      100 |     100 |     100 |                   
+ libs/movements-validator/src/no-duplicate-movement                   |     100 |      100 |     100 |     100 |                   
+  no-duplicate-movement.constraint.ts                                 |     100 |      100 |     100 |     100 |                   
+ libs/movements-validator/src/no-failed-balance                       |     100 |      100 |     100 |     100 |                   
+  no-failed-balances.constraint.ts                                    |     100 |      100 |     100 |     100 |                   
+ libs/movements-validator/src/no-uncontrolled-movement                |     100 |      100 |     100 |     100 |                   
+  no-uncontrolled-movement.constraint.ts                              |     100 |      100 |     100 |     100 |                   
- src                                                                  |       0 |        0 |       0 |       0 |                   
-  main.ts                                                             |       0 |        0 |       0 |       0 | 1-12              
+ src/movements-validation                                             |     100 |      100 |     100 |     100 |                   
+  movements-validation.controller.ts                                  |     100 |      100 |     100 |     100 |                   
+  movements-validation.dtos.ts                                        |     100 |      100 |     100 |     100 |                   
+  movements-validation.module.ts                                      |     100 |      100 |     100 |     100 |                   
+ src/validation-pipe-utils                                            |   92.59 |     92.3 |   85.71 |   92.59 |                   
+  validation-pipe-utils.ts                                            |   92.59 |     92.3 |   85.71 |   92.59 | 46,50             
-----------------------------------------------------------------------|---------|----------|---------|---------|-------------------

+Test Suites: 11 passed, 11 total
+Tests:       56 passed, 56 total
+Snapshots:   0 total
+Time:        11.091 s
+Ran all test suites.
```


---
# vous êtes encore là ? 😱😬 
# 🎁 Vous avez droit à un cadeau 🎁

vas-y vous pouvez tester l'application ou juste la lancer et la laisser se tester toute seul ??
```bash
npm install -g newman
npm run start &
newman run ./test/e2e/validation/validation_e2e_collection.json #this is a postman collection with configured tests executed via newman
kill -9 $(lsof -nP -iTCP:3000 -sTCP:LISTEN | awk 'NR>1 {print $2}')
```
☝️ node v20 required, newman est incompatible node v22


---
là c'est même mieux (vous devez avoir docker installé):

```bash
npm run test:e2e
```
☝️ on lance carrément un docker container par l'application et on le requête avec une collection Postman via `newman`
>ça c'est du vrai e2e👌
