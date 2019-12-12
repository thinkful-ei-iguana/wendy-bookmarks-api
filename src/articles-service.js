//stores our transactions
const BookmarksService = {
    getAllArticles(knex) {
        return knex.select('*').from('bookmarks')
    },
    insertArticle(knex, newBookmark) {
        return knex
            .insert(newBookmark)
            .into('bookmarks')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('bookmarks').select('*').where('id', id).first()
    },
    deleteArticle(knex, id) {
        return knex('bookmarks')
            .where({ id })
            .delete()
    },
    updateArticle(knex, id, newBookmarkField) {
        return knex('bookmarks')
            .where({ id })
            .update(newBookmarkField)
    },
}

module.exports = BookmarksService