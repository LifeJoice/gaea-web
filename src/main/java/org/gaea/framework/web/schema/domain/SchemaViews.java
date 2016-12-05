package org.gaea.framework.web.schema.domain;

import org.gaea.framework.web.schema.domain.view.SchemaActions;
import org.gaea.framework.web.schema.domain.view.SchemaDialog;
import org.gaea.framework.web.schema.domain.view.SchemaGrid;
import org.gaea.framework.web.schema.view.jo.SchemaGridJO;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Iverson on 2015/6/30.
 */
public class SchemaViews {
    private SchemaGrid grid;
    private SchemaGridJO gridJO;
    private List<SchemaDialog> dialogs;
    private SchemaActions actions;
    private SchemaImport imports;
    private String title;

    public SchemaGrid getGrid() {
        return grid;
    }

    public void setGrid(SchemaGrid grid) {
        this.grid = grid;
    }

    public SchemaGridJO getGridJO() {
        return gridJO;
    }

    public void setGridJO(SchemaGridJO gridJO) {
        this.gridJO = gridJO;
    }

    public List<SchemaDialog> getDialogs() {
        if(dialogs==null){
            dialogs = new ArrayList<SchemaDialog>();
        }
        return dialogs;
    }

    public void setDialogs(List<SchemaDialog> dialogs) {
        this.dialogs = dialogs;
    }

    public SchemaActions getActions() {
        return actions;
    }

    public void setActions(SchemaActions actions) {
        this.actions = actions;
    }

    public SchemaImport getImports() {
        if(this.imports==null){
            this.imports = new SchemaImport();
        }
        return imports;
    }

    public void setImports(SchemaImport imports) {
        this.imports = imports;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
