# SSH Commit Signing

Use this to ensure GitHub marks commits as **Verified** with SSH signing.

## 1) Configure Git signing (3 commands)

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/<your-signing-key>.pub
git config --global commit.gpgsign true
```

Your configured public key fingerprint must match a key added under GitHub **SSH signing keys**.

## 2) Local verification support (fixes allowedSignersFile error)

```bash
printf "<git-email> " > ~/.ssh/allowed_signers
cat ~/.ssh/<your-signing-key>.pub >> ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
```

## 3) Verify with a test commit

```bash
git commit -S --allow-empty -m "verify ssh signing"
git log --show-signature -1
```

If signing is correct, `git log --show-signature -1` reports an SSH signature and GitHub shows **Verified**.

## Notes

- Existing unsigned commits remain unsigned unless history is rewritten.
- If branch protection requires signed commits, unsigned commits can be blocked unless bypass rules are enabled.
- Apache-2.0 licensing does not require signed commits, but verified signatures improve provenance and supply-chain trust.
