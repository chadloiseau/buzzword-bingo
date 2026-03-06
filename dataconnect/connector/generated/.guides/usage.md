# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { seedData, listUsers, getBingoCard } from '@business-bingo/dataconnect';


// Operation SeedData: 
const { data } = await SeedData(dataConnect);

// Operation ListUsers: 
const { data } = await ListUsers(dataConnect);

// Operation GetBingoCard:  For variables, look at type GetBingoCardVars in ../index.d.ts
const { data } = await GetBingoCard(dataConnect, getBingoCardVars);


```