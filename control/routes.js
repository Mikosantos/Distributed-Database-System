import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    res.render('index',{
        cssFile: 'index.css'
    });
});

router.get("/create", (req, res) => {
    /* const db_selected = req.app.get('access'); */
    res.render('create', {
        error: null,
        cssFile: 'create.css'
        /* db_selected: db_selected */
    });
});

router.get("/update", (req, res) => {
    /* const db_selected = req.app.get('access'); */
    res.render('update', {
        error: null,
        cssFile: 'update.css'
        /* db_selected: db_selected */
    });
})

router.get("/search", (req, res) => {
    res.render('search', {
        results: null, 
        AppID: null, 
        error: null,
        cssFile: 'search.css'
    });
});


router.get("/delete", (req, res) => {
    res.render('delete',{
        error: null,
        cssFile: 'delete.css'
    });
})


export default router;
