# Criar Repositório no GitHub

## ✅ Commit Local Feito!

O repositório Git local já foi inicializado e o commit foi feito.

## Próximos Passos:

### Opção 1: Via Interface Web (Mais Fácil)

1. **Acesse**: https://github.com/new
2. **Nome do repositório**: `do-santos-market`
3. **Descrição**: `E-commerce Do Santos Market`
4. **Visibilidade**: Escolha Público ou Privado
5. **IMPORTANTE**: NÃO marque nenhuma opção (README, .gitignore, license)
6. **Clique em**: "Create repository"

### Opção 2: Executar Script Automático

Execute no PowerShell:
```powershell
.\setup-github.ps1
```

O script vai guiar você através do processo.

### Opção 3: Comandos Manuais

Após criar o repositório no GitHub, execute:

```powershell
git remote add origin https://github.com/SEU-USUARIO/do-santos-market.git
git branch -M main
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu username do GitHub.

## Depois do Push

1. Acesse o repositório no GitHub
2. Vá para a Vercel: https://vercel.com
3. Importe o repositório
4. Faça o deploy!
