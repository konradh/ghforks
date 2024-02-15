<template>
    <div class="text faq">
        <h2>FAQ</h2>
        <details>
            <summary>Why do I need to sign in to use this?</summary>
            <p>
                This app uses GitHub's <a href="https://docs.github.com/graphql">GraphQL API</a>, which requires
                authentication.
                While the REST API can be used without authentication within a small rate limit quota, the GraphQL API has
                the benefit that it can return more data in one request and only returns the data we need.
            </p>
        </details>
        <details>
            <summary>Why does this need full control of my private repositories?</summary>
            <p>
                This app does not mess with your private repositories.
                The <code>Ref.compare</code> function of the GraphQL API requires the <code>repo</code> scope when
                authenticating with an OAuth access token.
                I consider this a bug, as the same functionality works without special permissions when authenticating with
                a personal access token.
                The issue is documented <a href="https://github.com/orgs/community/discussions/106598">here</a> and I also
                filed a bug with GitHub support.
            </p>
        </details>
        <details>
            <summary>Why does this send my OAuth authorization code to your server?</summary>
            <p>
                GitHub does not support fully public OAuth clients. The Code Flow with PKCE and the deprecated Implicit Flow
                are not implemented.
                Additionally, the OAuth token endpoint does not support CORS pre-flight requests, so I can't include the
                client secret in the webpage and send the request from the browser, event if I want to.
                You can see the source of the OAuth relay <a
                    href="https://github.com/konradh/github-oauth-app-proxy">here</a>, but you have to trust me that that's
                actually
                the code running on the server and that I don't use your access token outside of the client-side web app.
            </p>
        </details>
    </div>
</template>